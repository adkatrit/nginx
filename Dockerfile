FROM nginx:alpine

# Copy site files
COPY site /usr/share/nginx/html

# Copy nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Railway sets PORT env var - nginx:alpine uses envsubst automatically
# for files in /etc/nginx/templates/
