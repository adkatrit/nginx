FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy site files
COPY site /usr/share/nginx/html

# Copy nginx config template
# nginx:alpine auto-processes *.template files in /etc/nginx/templates/
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Expose port (Railway sets $PORT)
EXPOSE 8080
