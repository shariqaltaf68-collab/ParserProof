package com.parserproof.app.data.api

import android.content.Context
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import java.util.concurrent.ConcurrentHashMap

class PersistentCookieJar(context: Context) : CookieJar {
    private val sharedPreferences = context.getSharedPreferences("parserproof_cookies", Context.MODE_PRIVATE)
    private val cookiesStorage = ConcurrentHashMap<String, MutableList<Cookie>>()

    init {
        val allEntries = sharedPreferences.all
        for ((key, value) in allEntries) {
            if (value is String) {
                val cookie = parseCookieString(value)
                if (cookie != null) {
                    val host = cookie.domain
                    val hostCookies = cookiesStorage.getOrPut(host) { ArrayList() }
                    hostCookies.removeAll { it.name == cookie.name && it.path == cookie.path }
                    hostCookies.add(cookie)
                }
            }
        }
    }

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val host = url.host
        val hostCookies = cookiesStorage.getOrPut(host) { ArrayList() }

        val editor = sharedPreferences.edit()
        for (cookie in cookies) {
            hostCookies.removeAll { it.name == cookie.name && it.path == cookie.path }
            if (cookie.expiresAt > System.currentTimeMillis()) {
                hostCookies.add(cookie)
                val cookieKey = "${cookie.domain}|${cookie.name}|${cookie.path}"
                editor.putString(cookieKey, encodeCookie(cookie))
            } else {
                val cookieKey = "${cookie.domain}|${cookie.name}|${cookie.path}"
                editor.remove(cookieKey)
            }
        }
        editor.apply()
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val host = url.host
        val validCookies = ArrayList<Cookie>()
        val now = System.currentTimeMillis()

        for ((domain, domainCookies) in cookiesStorage) {
            if (host == domain || (host.endsWith(".$domain") && domainCookies.any { it.domain == domain })) {
                val expiredCookies = ArrayList<Cookie>()
                for (cookie in domainCookies) {
                    if (cookie.expiresAt > now) {
                        validCookies.add(cookie)
                    } else {
                        expiredCookies.add(cookie)
                    }
                }
                if (expiredCookies.isNotEmpty()) {
                    domainCookies.removeAll(expiredCookies)
                    val editor = sharedPreferences.edit()
                    for (c in expiredCookies) {
                        val cookieKey = "${c.domain}|${c.name}|${c.path}"
                        editor.remove(cookieKey)
                    }
                    editor.apply()
                }
            }
        }
        return validCookies
    }

    fun clear() {
        cookiesStorage.clear()
        sharedPreferences.edit().clear().apply()
    }

    private fun encodeCookie(cookie: Cookie): String {
        return "${cookie.name};${cookie.value};${cookie.expiresAt};${cookie.domain};${cookie.path};${cookie.secure};${cookie.httpOnly}"
    }

    private fun parseCookieString(cookieStr: String): Cookie? {
        val parts = cookieStr.split(";")
        if (parts.size < 7) return null
        return try {
            val builder = Cookie.Builder()
                .name(parts[0])
                .value(parts[1])
                .expiresAt(parts[2].toLong())
                .domain(parts[3])
                .path(parts[4])
            if (parts[5].toBoolean()) builder.secure()
            if (parts[6].toBoolean()) builder.httpOnly()
            builder.build()
        } catch (e: Exception) {
            null
        }
    }
}
