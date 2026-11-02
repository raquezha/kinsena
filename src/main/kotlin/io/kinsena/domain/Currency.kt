package io.kinsena.domain

enum class Currency(val label: String, val symbol: String) {
    PHP("Philippine peso", "₱"),
    USD("US dollar", "$"),
    EUR("Euro", "€"),
    GBP("British pound", "£"),
    JPY("Japanese yen", "¥"),
    AUD("Australian dollar", "A$"),
    CAD("Canadian dollar", "C$"),
    SGD("Singapore dollar", "S$"),
    HKD("Hong Kong dollar", "HK$"),
}
