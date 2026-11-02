package io.kinsena

object BuildInfo {
    val version: String by lazy {
        BuildInfo::class.java.getResourceAsStream("/app-version.txt")
            ?.bufferedReader()
            ?.use { it.readText().trim() }
            ?: "development"
    }
}
