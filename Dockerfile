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
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD curl -fsS http://127.0.0.1:8080/login >/dev/null || exit 1
CMD ["java", "-jar", "app.jar"]
