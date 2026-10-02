# Deploying ZYOSEE on one free-tier EC2 instance

Tested end to end locally before writing: all five containers built, judged
submissions through the proxy, and the websocket upgraded. Total footprint
**173 MiB**, which is why one t3.micro is enough.

## What this does NOT use, and why

| Avoided | Reason |
|---|---|
| **ECR** | Free tier is 500 MB; the compiler image is 1.28 GB. The image is **built on the instance** instead |
| **Load balancer** | ~$16/month, never free |
| **NAT gateway** | ~$32/month. The commonest way a "free tier" account gets a bill |
| **A second instance** | Free tier covers 750 instance-hours a month — one instance, always on |

Building on the instance also removes the architecture problem: an image built
on an Apple Silicon Mac is `arm64` and will not run on a `t3.micro`, which is
`x86_64`. It fails with `exec format error`, and that is the single most common
way this deployment goes wrong.

## Costs to keep an eye on

- **Public IPv4 is now charged** at $0.005/hour (~$3.60/month). Free tier
  includes 750 hours/month for the first 12 months — enough for one instance.
  Two running at once will bill you.
- **An Elastic IP is free only while attached to a running instance.** If you
  **stop** the instance and leave the address allocated, it starts charging.
  Release it or keep the instance running.
- **Take 30 GB of EBS**, not the 8 GB default. Free tier allows 30 GB, and the
  image alone is 1.3 GB.

## 1 — Launch the instance

- **AMI** Amazon Linux 2023, **Type** `t3.micro`, **Storage** 30 GB gp3
- **Key pair** create one, keep the `.pem`
- **Security group** inbound:

| Port | Source | Why |
|---|---|---|
| 22 | **your IP only** | SSH. Never `0.0.0.0/0` |
| 80 | `0.0.0.0/0` | the app |

Only port 80. The APIs sit behind nginx, so 5001 and 8000 stay internal.

Then **Elastic IP → Allocate → Associate** with the instance. The frontend
bakes this address in at build time, so it must not change.

## 2 — Connect and prepare

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@<ELASTIC-IP>
```

```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
```

`usermod` must come **after** installing Docker — the `docker` group does not
exist before that. Then reconnect so the new group applies:

```bash
exit
ssh -i your-key.pem ec2-user@<ELASTIC-IP>
docker info | head -3        # works without sudo = the group took effect
```

Docker Compose v2 as a plugin:

```bash
sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo curl -sSL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/libexec/docker/cli-plugins/docker-compose
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose
docker compose version
```

**Add swap.** 1 GB of RAM is enough to run this but tight while *building* —
`npm ci` and a C++ toolchain install can exhaust it and the build dies with no
useful error.

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

## 3 — Get the code and the test data

```bash
git clone https://github.com/blando17/zyosee.git
cd zyosee
```

Test data is not in the repository — 122 MB, and hidden test cases do not
belong in a public repo. Send it from your laptop, in another terminal:

```bash
scp -i your-key.pem /tmp/zyosee-testdata.tar.gz ec2-user@<ELASTIC-IP>:~/
```

46 MB compressed. Back on the instance:

```bash
tar -xzf ~/zyosee-testdata.tar.gz -C ~/zyosee/deploy/
ls ~/zyosee/deploy/testdata | wc -l      # 73
```

## 4 — Configure

```bash
cp deploy/.env.sample deploy/.env
nano deploy/.env
```

Must be set:

- `PUBLIC_URL` and `CLIENT_URL` — both `http://<ELASTIC-IP>`, no trailing slash
- `MONGODB_URI` — your Atlas connection string
- `DB_NAME` — `zyosee_prod`
- `JWT_SECRET_KEY` — `openssl rand -base64 48`

**In Atlas, Network Access → add the Elastic IP.** Without it every request
fails with a server-selection timeout that looks like a broken app.

## 5 — Build and run

```bash
docker compose -f deploy/docker-compose.prod.yml up -d --build
```

First build takes 10–20 minutes on a t3.micro — a Debian image with gcc, g++,
Python and a JDK. Later rebuilds are much faster.

```bash
docker compose -f deploy/docker-compose.prod.yml ps
curl -s localhost/auth/ && curl -s localhost/judge/ | head -c 60
```

Open `http://<ELASTIC-IP>`.

## 6 — Check it

```bash
docker stats --no-stream          # expect ~175 MiB total
docker compose -f deploy/docker-compose.prod.yml logs -f worker
```

Sign up, open a problem, submit a solution. A verdict proves the whole chain:
nginx → compiler → Redis → worker → test files → MongoDB.

## The test set

The deployment carries the **complete set: 73 problems, 1,166 tests, 122 MB**.

There is no size cap and no omitted stress case, so a verdict here means the
same thing a verdict on your laptop means. That was not true of an earlier
version of this file, which shipped a 1 MB-capped subset because the test
corpus was then 4.6 GB and would not fit a t3.micro's disk alongside the
images. The corpus that made the cap necessary is no longer part of the
project, so the cap went with it.

## If something is wrong

| Symptom | Cause |
|---|---|
| `exec format error` | an arm64 image. Build on the instance, do not push one from a Mac |
| Blank page, API calls fail | `PUBLIC_URL` was wrong when the frontend was built. Fix `.env`, then rebuild: `up -d --build frontend` |
| Everything times out | the Elastic IP is not in Atlas Network Access |
| Pair Lab never connects | the websocket. Check `nginx-upgrade.conf` is mounted |
| Build killed with no error | out of memory. Add the swap file |
| Submissions queue but never finish | `docker compose logs worker` |
