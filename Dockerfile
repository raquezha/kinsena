FROM gradle:8.10.2-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle build -x test --no-daemon

FROM openjdk:21-slim
WORKDIR /app
COPY --from=build /app/build/libs/*-all.jar app.jar
EXPOSE 8080
VOLUME /app/data
ENV DB_PATH=/app/data/kinsena.db
CMD ["java", "-jar", "app.jar"]
