package com.parserproof.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.widget.Toast
import com.parserproof.app.data.model.LoginRequest
import com.parserproof.app.data.model.SignupRequest
import com.parserproof.app.data.model.VerifyRequest
import com.parserproof.app.data.repository.AuthRepository
import com.parserproof.app.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun AuthScreen(
    onLoginSuccess: () -> Unit
) {
    var isLoginTab by remember { mutableStateOf(true) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    
    var isVerifying by remember { mutableStateOf(false) }
    var verificationCode by remember { mutableStateOf("") }
    var pendingVerifyEmail by remember { mutableStateOf("") }
    
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    
    val authRepository = remember { AuthRepository() }
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundMatte)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        if (isVerifying) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Verify Email", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextWhite)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "We've sent a 6-digit verification code to $pendingVerifyEmail. Please enter it below.",
                        fontSize = 13.sp,
                        color = TextMuted,
                        lineHeight = 18.sp
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = verificationCode,
                        onValueChange = { if (it.length <= 6) verificationCode = it },
                        label = { Text("6-Digit Code") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    
                    errorMessage?.let {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(
                        onClick = {
                            scope.launch {
                                isLoading = true
                                errorMessage = null
                                val result = authRepository.verify(VerifyRequest(pendingVerifyEmail, verificationCode))
                                isLoading = false
                                if (result.isSuccess) {
                                    isVerifying = false
                                    isLoginTab = true
                                    verificationCode = ""
                                    errorMessage = "Account verified! You can now log in."
                                } else {
                                    errorMessage = result.exceptionOrNull()?.message ?: "Verification failed"
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        enabled = verificationCode.length == 6 && !isLoading
                    ) {
                        if (isLoading) CircularProgressIndicator(color = TextWhite, modifier = Modifier.size(20.dp))
                        else Text("Verify Code", fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = { isVerifying = false }) {
                        Text("Back to Registration")
                    }
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(scrollState),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "ParserProof",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
                Text(
                    text = "Unlock your SDE Sourcing potential",
                    fontSize = 14.sp,
                    color = TextMuted
                )
                
                Spacer(modifier = Modifier.height(32.dp))
                
                TabRow(
                    selectedTabIndex = if (isLoginTab) 0 else 1,
                    modifier = Modifier.fillMaxWidth(),
                    containerColor = Color.Transparent
                ) {
                    Tab(
                        selected = isLoginTab,
                        onClick = { isLoginTab = true; errorMessage = null },
                        text = { Text("Log In", fontSize = 15.sp, fontWeight = FontWeight.SemiBold) }
                    )
                    Tab(
                        selected = !isLoginTab,
                        onClick = { isLoginTab = false; errorMessage = null },
                        text = { Text("Sign Up", fontSize = 15.sp, fontWeight = FontWeight.SemiBold) }
                    )
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                if (!isLoginTab) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Full Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            capitalization = KeyboardCapitalization.Words,
                            imeAction = ImeAction.Next
                        ),
                        keyboardActions = KeyboardActions(
                            onNext = { focusManager.moveFocus(FocusDirection.Down) }
                        )
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                }
                
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next
                    ),
                    keyboardActions = KeyboardActions(
                        onNext = { focusManager.moveFocus(FocusDirection.Down) }
                    )
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = { focusManager.clearFocus() }
                    )
                )
                
                if (isLoginTab) {
                    TextButton(
                        onClick = { 
                            if (email.isEmpty()) {
                                Toast.makeText(context, "Please enter your email first", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "Password reset link sent to your email", Toast.LENGTH_LONG).show()
                                scope.launch {
                                    authRepository.forgotPassword(email)
                                }
                            }
                        },
                        modifier = Modifier.align(Alignment.End),
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Text("Forgot Password?", fontSize = 13.sp, color = PurplePrimary, fontWeight = FontWeight.SemiBold)
                    }
                } else {
                    Spacer(modifier = Modifier.height(16.dp))
                }
                
                errorMessage?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = it,
                        color = if (it.contains("verified")) EmeraldSuccess else CrimsonError,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(horizontal = 4.dp)
                    )
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Button(
                    onClick = {
                        scope.launch {
                            isLoading = true
                            errorMessage = null
                            if (isLoginTab) {
                                val result = authRepository.login(LoginRequest(email.trim().lowercase(), password))
                                if (result.isSuccess) {
                                    onLoginSuccess()
                                } else {
                                    errorMessage = result.exceptionOrNull()?.message ?: "Invalid email or password"
                                }
                            } else {
                                val result = authRepository.signup(SignupRequest(name, email.trim().lowercase(), password))
                                if (result.isSuccess) {
                                    pendingVerifyEmail = email.trim().lowercase()
                                    isVerifying = true
                                } else {
                                    errorMessage = result.exceptionOrNull()?.message ?: "Signup failed"
                                }
                            }
                            isLoading = false
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    enabled = email.isNotEmpty() && password.isNotEmpty() && (isLoginTab || name.isNotEmpty()) && !isLoading
                ) {
                    if (isLoading) CircularProgressIndicator(color = TextWhite, modifier = Modifier.size(20.dp))
                    else Text(if (isLoginTab) "Sign In" else "Create Account", fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}
