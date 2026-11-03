FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /workspace
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
COPY src src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre

RUN groupadd --system gestion \
    && useradd --system --gid gestion --uid 10001 gestion \
    && mkdir -p /data/jena /opt/gestion \
    && chown -R gestion:gestion /data /opt/gestion

WORKDIR /opt/gestion
COPY --from=build /workspace/target/gestion-backend-0.0.1-SNAPSHOT.jar /opt/gestion/app.jar

USER gestion
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/opt/gestion/app.jar"]
