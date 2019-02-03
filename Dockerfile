ARG BUILD_FROM=alpine:3.9
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

# Environment variables
ENV \
    HOME="/root" \
    LANG="C.UTF-8" \
    PS1="$(whoami)@$(hostname):$(pwd)$ " \
    S6_BEHAVIOUR_IF_STAGE2_FAILS=2 \
    S6_CMD_WAIT_FOR_SERVICES=1 \
    TERM="xterm"

# Copy app
COPY . /opt/streamdeck-macros

# Copy root filesystem
COPY rootfs /

# Build arch argument
ARG BUILD_ARCH=amd64

# Set shell
SHELL ["/bin/ash", "-o", "pipefail", "-c"]

# Install system
# hadolint ignore=DL3003
RUN \
    set -o pipefail \
    \
    && echo '@edge http://dl-cdn.alpinelinux.org/alpine/edge/main' >> /etc/apk/repositories \
    && echo '@edge http://dl-cdn.alpinelinux.org/alpine/edge/community' >> /etc/apk/repositories \
    && echo '@edge http://dl-cdn.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories \
    \
    && apk add --no-cache --virtual .build-dependencies \
        build-base=0.5-r1 \
        curl=7.63.0-r0 \
        fftw-dev=3.3.8-r0 \
        git=2.20.1-r0 \
        libstdc++=8.2.0-r2 \
        libusb-dev=1.0.22-r0 \
        python2=2.7.15-r3 \
        tar=1.31-r0 \
        yarn=1.12.3-r0 \
    \
    && apk add --no-cache \
        apk-tools=2.10.3-r1 \
        bash=4.4.19-r1 \
        busybox=1.29.3-r10 \
        ca-certificates=20190108-r0 \
        nodejs-current=11.3.0-r0 \
        tzdata=2018i-r0 \
        vips-dev@edge=8.7.4-r1 \
    \
    && if [ "${BUILD_ARCH}" = "i386" ]; then S6_ARCH="x86"; else S6_ARCH="${BUILD_ARCH}"; fi \
    \
    && curl -L -s "https://github.com/just-containers/s6-overlay/releases/download/v1.21.7.0/s6-overlay-${S6_ARCH}.tar.gz" \
        | tar zxvf - -C / \
    \
    && mkdir -p /etc/fix-attrs.d \
    \
    && yarn global add node-gyp \
    \
    && cd /opt/streamdeck-macros \
    && yarn install \
    \
    && yarn global remove node-gyp \
    && yarn cache clean \
    && apk del --purge .build-dependencies \
    && apk del --purge vips-dev \
    && rm -fr /tmp/*

# Entrypoint & CMD
ENTRYPOINT ["/init"]

# Build arguments
ARG BUILD_DATE
ARG BUILD_REF
ARG BUILD_VERSION

# Labels
LABEL \
    maintainer="Timmo <contact@timmo.xyz>" \
    org.label-schema.description="Macros for my Elgato Stream Deck" \
    org.label-schema.build-date=${BUILD_DATE} \
    org.label-schema.name="Stream Deck Macros" \
    org.label-schema.schema-version="1.0" \
    org.label-schema.url="https://git.timmo.xyz/streamdeck-macros" \
    org.label-schema.usage="https://github.com/timmo001/streamdeck-macros/tree/master/README.md" \
    org.label-schema.vcs-ref=${BUILD_REF} \
    org.label-schema.vcs-url="https://github.com/timmo001/streamdeck-macros" \
    org.label-schema.vendor="Timmo"
