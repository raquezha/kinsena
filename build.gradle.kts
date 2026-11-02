plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.ktor)
    application
}

group = "io.kinsena"
version = providers.gradleProperty("version").getOrElse("0.1.0")

val generateAppVersion by tasks.registering {
    val output = layout.buildDirectory.file("generated/resources/app-version.txt")
    outputs.file(output)
    doLast {
        output.get().asFile.apply {
            parentFile.mkdirs()
            writeText(project.version.toString())
        }
    }
}

tasks.processResources {
    dependsOn(generateAppVersion)
    from(generateAppVersion)
}

application {
    mainClass.set("io.kinsena.ApplicationKt")
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.server.netty)
    implementation(libs.ktor.server.html.builder)
    implementation(libs.ktor.server.status.pages)
    
    // Database: SQLite + Exposed (Lightweight ORM)
    implementation(libs.exposed.core)
    implementation(libs.exposed.jdbc)
    implementation(libs.sqlite.jdbc)
    
    // Logging
    implementation(libs.logback.classic)

    testImplementation(libs.kotlin.test)
    testImplementation(libs.ktor.server.tests)
}

tasks.test {
    useJUnitPlatform()
}
