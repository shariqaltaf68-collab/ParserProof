package com.parserproof.app.data.api

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private var BASE_URL = "https://parserproof.vercel.app/" // Default Vercel production build URL

    private var apiService: ApiService? = null
    private var cookieJar: PersistentCookieJar? = null

    fun initialize(context: Context, customUrl: String? = null) {
        if (customUrl != null) {
            BASE_URL = customUrl
        }

        val logger = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val jar = PersistentCookieJar(context.applicationContext)
        cookieJar = jar

        val okHttpClient = OkHttpClient.Builder()
            .cookieJar(jar)
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val originalRequest = chain.request()
                val requestBuilder = originalRequest.newBuilder()
                    .header("User-Agent", "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36")
                    .header("Origin", "https://parserproof.vercel.app")
                    .header("Referer", "https://parserproof.vercel.app/")
                
                // Keep any existing headers if okhttp set them, but force these overrides
                val modifiedRequest = requestBuilder.build()
                chain.proceed(modifiedRequest)
            }
            .addInterceptor(logger)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        apiService = retrofit.create(ApiService::class.java)
    }

    fun getService(): ApiService {
        return apiService ?: throw IllegalStateException("RetrofitClient has not been initialized. Call initialize(context) first.")
    }

    fun logout() {
        cookieJar?.clear()
    }
}
