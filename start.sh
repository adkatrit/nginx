#!/bin/sh
sed "s/\${PORT}/${PORT:-8080}/g" /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
