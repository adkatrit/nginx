FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy site files
COPY site /usr/share/nginx/html

# Auto cache-bust: replace all ?v=XX in index.html with build timestamp
RUN BUST="v=$(date +%s)" && \
    sed -i "s/\?v=[0-9]*/\?${BUST}/g" /usr/share/nginx/html/index.html

# Copy nginx config template
# nginx:alpine auto-processes *.template files in /etc/nginx/templates/
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Expose port (Railway sets $PORT)
EXPOSE 8080
