# the only versions supported by pgxman are on bookworm or bullseye
FROM postgres:15.5-bookworm

RUN apt-get update && \
  apt-get install -y curl && \
  curl -sfL https://install.pgx.sh | sh - && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

COPY pgxman.yaml /pgxman/pgxman.yaml

WORKDIR /pgxman
RUN pgxman pack install -f pgxman.yaml -y --debug