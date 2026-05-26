package com.parserproof.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.parserproof.app.data.model.CreateProjectRequest
import com.parserproof.app.data.repository.ProjectRepository
import com.parserproof.app.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobDescScreen(
    resumeText: String,
    onNavigateBack: () -> Unit,
    onNavigateToResults: (projectId: String) -> Unit
) {
    var jobDescription by remember { mutableStateOf("") }
    var jobTitle by remember { mutableStateOf("") }
    var company by remember { mutableStateOf("") }
    
    var selectedTone by remember { mutableStateOf("professional") }
    var selectedLength by remember { mutableStateOf("one-page") }
    
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    
    val projectRepository = remember { ProjectRepository() }
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Target Job Specs", fontWeight = FontWeight.Bold, fontSize = 20.sp) },
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(BackgroundMatte),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(60.dp),
                            color = PurplePrimary,
                            strokeWidth = 5.dp
                        )
                        Spacer(modifier = Modifier.height(20.dp))
                        Text(
                            text = "Matching Keyword Gaps...",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextWhite
                        )
                        Text(
                            text = "This runs deep Groq RAG checks and takes ~10 seconds.",
                            fontSize = 13.sp,
                            color = TextMuted,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp)
                        .verticalScroll(scrollState),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "Paste Target Job Description",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite,
                        modifier = Modifier.align(Alignment.Start)
                    )
                    OutlinedTextField(
                        value = jobDescription,
                        onValueChange = { jobDescription = it },
                        placeholder = { Text("Paste the target job description or post text here...") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp),
                        maxLines = 10,
                        shape = RoundedCornerShape(12.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Job Meta Details (Optional)",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite,
                        modifier = Modifier.align(Alignment.Start)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = jobTitle,
                            onValueChange = { jobTitle = it },
                            label = { Text("Job Title") },
                            placeholder = { Text("e.g. SDE-1") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = company,
                            onValueChange = { company = it },
                            label = { Text("Company") },
                            placeholder = { Text("e.g. Google") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Optimization Parameters",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite,
                        modifier = Modifier.align(Alignment.Start)
                    )
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("Desired Tone:", fontSize = 12.sp, color = TextMuted)
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            listOf("professional", "technical").forEach { tone ->
                                FilterChip(
                                    selected = selectedTone == tone,
                                    onClick = { selectedTone = tone },
                                    label = { Text(tone.uppercase(), fontSize = 12.sp) }
                                )
                            }
                        }
                    }

                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("Resume Page Length Target:", fontSize = 12.sp, color = TextMuted)
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            listOf("one-page", "two-page").forEach { length ->
                                FilterChip(
                                    selected = selectedLength == length,
                                    onClick = { selectedLength = length },
                                    label = { Text(length.uppercase(), fontSize = 12.sp) }
                                )
                            }
                        }
                    }

                    errorMessage?.let {
                        Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            scope.launch {
                                isLoading = true
                                errorMessage = null
                                
                                val request = CreateProjectRequest(
                                    resumeText = resumeText,
                                    jobDescription = jobDescription,
                                    jobTitle = if (jobTitle.trim().isNotEmpty()) jobTitle else null,
                                    company = if (company.trim().isNotEmpty()) company else null,
                                    tone = selectedTone,
                                    length = selectedLength
                                )
                                
                                val result = projectRepository.generateProject(request)
                                if (result.isSuccess) {
                                    val createdProj = result.getOrThrow()
                                    onNavigateToResults(createdProj.id)
                                } else {
                                    errorMessage = result.exceptionOrNull()?.message ?: "Failed to tailoring optimization. Please check your network and try again."
                                    isLoading = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        enabled = jobDescription.trim().length > 50
                    ) {
                        Text("Generate & Score Resume", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
