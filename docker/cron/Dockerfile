FROM alpine:3.20
RUN apk add --no-cache curl
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
# Đợi web (có thể 60s) — phục vụ sleep trong script
CMD ["/bin/sh", "/entrypoint.sh"]
