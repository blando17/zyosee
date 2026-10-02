# The image for the compiler and judge service.
#
# The course Dockerfile for a MERN backend is "FROM node:alpine, npm i, run it",
# and that is right for a server that only serves JSON. This service also runs
# other people's C, C++, Python and Java, so the image has to carry those four
# toolchains. A plain node image carries none of them and every submission would
# fail with "g++: not found".
#
# Debian rather than Alpine. Alpine is much smaller but ships musl libc, where
# <bits/stdc++.h> and a headless JDK are both more trouble than they are worth.
# Debian gives the GNU toolchain competitive programmers actually write against.
FROM node:22-bookworm-slim

# build-essential is gcc, g++ and make in one package. The JDK is the headless
# variant because a judge never opens a window, and that saves a few hundred MB.
# Wiping the apt lists in the same layer keeps them out of the image.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        python3 \
        default-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies before source. Docker caches each step, so editing judge.js
# rebuilds only the layers below this point instead of reinstalling npm.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Scratch space for submitted source and compiled binaries. generateFile.js
# creates these at startup too, but it runs as an unprivileged user by then and
# /app is owned by root, so they are made here while root still can.
RUN mkdir -p codes outputs && chown -R node:node codes outputs

# Submitted programs inherit the identity of this process. Root inside a
# container is still root over everything the container can touch, so the
# service drops to the unprivileged user the node image already provides.
USER node

EXPOSE 8000
CMD ["node", "index.js"]
