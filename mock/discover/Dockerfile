FROM node:18-alpine

RUN npm i -g json-server@0.17.4

WORKDIR /mock
COPY db.json routes.json ./

EXPOSE 4000

CMD ["json-server", "--watch", "/mock/db.json", "--routes", "/mock/routes.json", "--port", "4000", "--host", "0.0.0.0"]


