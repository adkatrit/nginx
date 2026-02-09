FROM fholzer/nginx-brotli:latest

# Remove default config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy site files
COPY site /usr/share/nginx/html

# Auto cache-bust: replace all ?v=XX in index.html with build timestamp
RUN BUST=$(date +%s) && \
    sed -i "s/?v=[0-9]*/?v=${BUST}/g" /usr/share/nginx/html/index.html

# Copy nginx config template and startup script
COPY nginx.conf /etc/nginx/nginx.conf.template
COPY start.sh /start.sh
RUN sed -i 's/\r$//' /start.sh && chmod +x /start.sh

# Expose port (Railway sets $PORT)
EXPOSE 8080

ENTRYPOINT []
CMD ["/start.sh"]
