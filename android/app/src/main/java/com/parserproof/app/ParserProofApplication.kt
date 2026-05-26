package com.parserproof.app

import android.app.Application
import android.util.Log
import com.parserproof.app.data.api.RetrofitClient

class ParserProofApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Log.d("ParserProofApplication", "ParserProof Application Initialized successfully!")
        
        // Initialize network client with application context
        try {
            RetrofitClient.initialize(this)
            Log.d("ParserProofApplication", "RetrofitClient initialized successfully!")
        } catch (e: Exception) {
            Log.e("ParserProofApplication", "Failed to initialize RetrofitClient: ${e.message}", e)
        }
    }
}
