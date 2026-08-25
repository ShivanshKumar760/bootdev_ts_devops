# # Build from a slim Debian/Linux image
# FROM debian:stable-slim

# # Update apt
# RUN apt update
# RUN apt upgrade -y

# # Install build tooling
# RUN apt install -y build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev libsqlite3-dev wget libbz2-dev

# # Download Python interpreter code and unpack it
# RUN wget https://www.python.org/ftp/python/3.10.8/Python-3.10.8.tgz
# RUN tar -xf Python-3.10.*.tgz

# # Build the Python interpreter
# RUN cd Python-3.10.8 && ./configure --enable-optimizations && make && make altinstall

# # Copy our code into the image
# COPY main.py main.py

# # Copy our data dependencies
# COPY books/ books/

# # Run our Python script
# CMD ["python3.10", "main.py"]


# syntax=docker/dockerfile:1

##############################
# Stage 1: build Python from source, with signature verification
##############################
# FROM debian:stable-slim AS builder

# # Build-time args so the Python version is easy to bump without editing the whole file
# ARG PYTHON_VERSION=3.10.21
# # Key ID confirmed from https://www.python.org/downloads/metadata/pgp/ :
# # Pablo Galindo Salgado signs 3.10.x / 3.11.x source releases.
# ARG PYTHON_GPG_KEY=64E628F8D684696D

# # --no-install-recommends keeps this stage leaner; combining into one RUN
# # avoids stale-cache issues between "update" and "install" layers, and
# # cleaning apt lists here matters less since this whole stage is discarded
# # later, but it's still good hygiene while the layer exists.
# RUN apt-get update && apt-get install -y --no-install-recommends \
#         build-essential \
#         zlib1g-dev \
#         libncurses5-dev \
#         libgdbm-dev \
#         libnss3-dev \
#         libssl-dev \
#         libreadline-dev \
#         libffi-dev \
#         libsqlite3-dev \
#         libbz2-dev \
#         wget \
#         gnupg \
#         dirmngr \
#         ca-certificates \
#     && rm -rf /var/lib/apt/lists/*

# WORKDIR /build

# # Download the source tarball AND its detached signature, then verify
# # before extracting anything. This is the step the original Dockerfile
# # skipped entirely — without it you're compiling and running unverified
# # code with no way to detect tampering.
# RUN wget -q "https://www.python.org/ftp/python/${PYTHON_VERSION}/Python-${PYTHON_VERSION}.tgz" \
#     && wget -q "https://www.python.org/ftp/python/${PYTHON_VERSION}/Python-${PYTHON_VERSION}.tgz.asc" \
#     && gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys "${PYTHON_GPG_KEY}" \
#     && gpg --batch --verify "Python-${PYTHON_VERSION}.tgz.asc" "Python-${PYTHON_VERSION}.tgz" \
#     && tar -xf "Python-${PYTHON_VERSION}.tgz"

# # make altinstall (not "install") deliberately avoids overwriting any
# # system python3 binary Debian itself relies on.
# RUN cd "Python-${PYTHON_VERSION}" \
#     && ./configure --enable-optimizations \
#     && make -j"$(nproc)" \
#     && make altinstall

# ##############################
# # Stage 2: minimal runtime image — only the compiled interpreter + app code,
# # none of the compiler toolchain or source tree survive into this stage.
# ##############################
# FROM debian:stable-slim

# ARG PYTHON_VERSION=3.10.21
# # Derive the "3.10" style minor version for the lib path.
# ARG PYTHON_MINOR=3.10

# # Runtime needs a few shared libs the compiled interpreter links against,
# # but none of the -dev headers or build-essential toolchain.
# RUN apt-get update && apt-get install -y --no-install-recommends \
#         libssl3 \
#         libsqlite3-0 \
#         libbz2-1.0 \
#         libffi8 \
#         zlib1g \
#     && rm -rf /var/lib/apt/lists/*

# COPY --from=builder /usr/local/lib/python${PYTHON_MINOR} /usr/local/lib/python${PYTHON_MINOR}
# COPY --from=builder /usr/local/bin/python${PYTHON_MINOR} /usr/local/bin/python${PYTHON_MINOR}
# COPY --from=builder /usr/local/lib/libpython${PYTHON_MINOR}* /usr/local/lib/

# RUN ldconfig

# # Run as a dedicated non-root user rather than the container default root.
# RUN useradd --create-home --shell /usr/sbin/nologin appuser

# WORKDIR /app
# COPY main.py main.py
# COPY books/ books/
# RUN chown -R appuser:appuser /app

# USER appuser

# CMD ["python3.10", "main.py"]


FROM python:3.10-slim

RUN useradd --create-home --shell /usr/sbin/nologin appuser

WORKDIR /app
COPY main.py main.py
COPY books/ books/
RUN chown -R appuser:appuser /app

USER appuser
CMD ["python3.10", "main.py"]