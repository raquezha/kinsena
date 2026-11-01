FROM gradle:8.10.2-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle build --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*-all.jar app.jar
EXPOSE 8080
VOLUME /app/data
ENV DB_PATH=/app/data/kinsena.db HOST=0.0.0.0
CMD ["java", "-jar", "app.jar"]
