package com.parserproof.app.ui.screens

import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.parserproof.app.data.repository.ProjectRepository
import com.parserproof.app.ui.theme.*
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UploadScreen(
    onNavigateBack: () -> Unit,
    onNavigateToJobDesc: (resumeText: String) -> Unit
) {
    var resumeText by remember { mutableStateOf("") }
    var isTextTab by remember { mutableStateOf(false) }
    var uploadedFileName by remember { mutableStateOf<String?>(null) }
    
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    
    val context = LocalContext.current
    val projectRepository = remember { ProjectRepository() }
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            scope.launch {
                isLoading = true
                errorMessage = null
                try {
                    var name = "resume.pdf"
                    context.contentResolver.query(it, null, null, null, null)?.use { cursor ->
                        val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                        if (nameIndex != -1 && cursor.moveToFirst()) {
                            name = cursor.getString(nameIndex)
                        }
                    }
                    uploadedFileName = name

                    val tempFile = File(context.cacheDir, name)
                    context.contentResolver.openInputStream(it)?.use { input ->
                        FileOutputStream(tempFile).use { output ->
                            input.copyTo(output)
                        }
                    }

                    val result = projectRepository.uploadResume(tempFile)
                    if (result.isSuccess) {
                        resumeText = result.getOrThrow().text
                        onNavigateToJobDesc(resumeText)
                    } else {
                        errorMessage = result.exceptionOrNull()?.message ?: "Failed to parse PDF file. Please try pasting the text instead."
                    }
                } catch (e: Exception) {
                    errorMessage = "Error reading file: ${e.localizedMessage}. Please try pasting text."
                } finally {
                    isLoading = false
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Upload Resume", fontWeight = FontWeight.Bold, fontSize = 20.sp) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = TextWhite)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BackgroundMatte)
            )
        },
        containerColor = BackgroundMatte
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(24.dp)
                .verticalScroll(scrollState),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "ParserProof ATS Scanner",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = TextWhite
            )
            Text(
                text = "We will scan your content to match job search standards.",
                fontSize = 13.sp,
                color = TextMuted,
                modifier = Modifier.padding(top = 4.dp)
            )
            
            Spacer(modifier = Modifier.height(28.dp))

            TabRow(
                selectedTabIndex = if (isTextTab) 1 else 0,
                modifier = Modifier.fillMaxWidth(),
                containerColor = Color.Transparent
            ) {
                Tab(
                    selected = !isTextTab,
                    onClick = { isTextTab = false; errorMessage = null },
                    text = { Text("PDF Upload", fontSize = 15.sp, fontWeight = FontWeight.SemiBold) }
                )
                Tab(
                    selected = isTextTab,
                    onClick = { isTextTab = true; errorMessage = null },
                    text = { Text("Paste Text", fontSize = 15.sp, fontWeight = FontWeight.SemiBold) }
                )
            }
            
            Spacer(modifier = Modifier.height(28.dp))

            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(color = PurplePrimary)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Extracting PDF text via Vercel...", fontSize = 13.sp, color = TextMuted)
                    }
                }
            } else if (!isTextTab) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .border(1.5.dp, Color(0x3CFFFFFF), RoundedCornerShape(12.dp))
                        .background(SurfaceCharcoal, RoundedCornerShape(12.dp))
                        .clickable { filePickerLauncher.launch("application/pdf") },
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(24.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = PurplePrimary,
                            modifier = Modifier.size(44.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = uploadedFileName ?: "Choose Resume PDF file",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextWhite
                        )
                        Text(
                            text = "Supports standard PDF formats up to 5MB",
                            fontSize = 12.sp,
                            color = TextMuted,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            } else {
                OutlinedTextField(
                    value = resumeText,
                    onValueChange = { resumeText = it },
                    label = { Text("Paste Resume Text") },
                    placeholder = { Text("Copy the entire text from your resume doc and paste it here...") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(260.dp),
                    maxLines = 15,
                    shape = RoundedCornerShape(12.dp)
                )
            }

            errorMessage?.let {
                Spacer(modifier = Modifier.height(16.dp))
                Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
            }

            Spacer(modifier = Modifier.height(32.dp))

            if (isTextTab) {
                Button(
                    onClick = { onNavigateToJobDesc(resumeText) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    enabled = resumeText.trim().length > 50
                ) {
                    Text("Continue to Job Posting", fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}
