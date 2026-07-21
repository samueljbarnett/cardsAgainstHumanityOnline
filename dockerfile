FROM node:24-slim

WORKDIR /app
COPY . .
EXPOSE 8080
CMD ["node", "."]
