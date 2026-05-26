package com.parserproof.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.parserproof.app.data.model.Project
import com.parserproof.app.data.repository.ProjectRepository
import com.parserproof.app.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToUpload: () -> Unit,
    onNavigateToProject: (projectId: String) -> Unit,
    onNavigateToChat: (projectId: String) -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToHistory: () -> Unit
) {
    var projectsList by remember { mutableStateOf<List<Project>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    
    val projectRepository = remember { ProjectRepository() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        scope.launch {
            val result = projectRepository.getProjects(limit = 5)
            if (result.isSuccess) {
                projectsList = result.getOrDefault(emptyList())
            }
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("ParserProof", fontWeight = FontWeight.Bold, fontSize = 20.sp) },
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(imageVector = Icons.Default.Menu, contentDescription = "Settings", tint = TextWhite)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BackgroundMatte)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToUpload,
                containerColor = PurplePrimary,
                contentColor = TextWhite,
                shape = CircleShape
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "New Scan")
            }
        },
        bottomBar = {
            NavigationBar(containerColor = SurfaceCharcoal) {
                NavigationBarItem(
                    selected = true,
                    onClick = {},
                    icon = { Icon(Icons.Default.Home, contentDescription = null) },
                    label = { Text("Dashboard") }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onNavigateToHistory,
                    icon = { Icon(Icons.Default.List, contentDescription = null) },
                    label = { Text("History") }
                )
            }
        },
        containerColor = BackgroundMatte
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 20.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = PurplePrimary
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        Spacer(modifier = Modifier.height(10.dp))
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = SurfaceCharcoal),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Text(
                                    text = "Welcome to ParserProof",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextWhite
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "Optimize your work history, remove critical formatting traps, and pass automated screening tests.",
                                    fontSize = 13.sp,
                                    color = TextMuted,
                                    lineHeight = 18.sp
                                )
                            }
                        }
                    }

                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    val lastProjId = projectsList.firstOrNull()?.id ?: "new"
                                    onNavigateToChat(lastProjId)
                                },
                            colors = CardDefaults.cardColors(containerColor = Color(0x1F8B5CF6)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "💬 Ask Assistant Copilot",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = PurplePrimary
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "STAR Bullet rewriter, cover letters, and interview coaching.",
                                        fontSize = 12.sp,
                                        color = TextSecondary
                                    )
                                }
                                Button(
                                    onClick = {
                                        val lastProjId = projectsList.firstOrNull()?.id ?: "new"
                                        onNavigateToChat(lastProjId)
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = PurplePrimary),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("Chat", fontSize = 12.sp)
                                }
                            }
                        }
                    }

                    item {
                        Text(
                            text = "Recent Optimization Projects",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextWhite,
                            modifier = Modifier.padding(top = 10.dp)
                        )
                    }

                    if (projectsList.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(150.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No optimization projects yet. Click + to scan your first resume!",
                                    fontSize = 13.sp,
                                    color = TextMuted
                                )
                            }
                        }
                    } else {
                        items(projectsList) { project ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onNavigateToProject(project.id) },
                                colors = CardDefaults.cardColors(containerColor = SurfaceCharcoal),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = project.title,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = TextWhite
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = "Status: ${project.status.uppercase()}",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = EmeraldSuccess
                                        )
                                    }
                                    
                                    project.atsScore?.let { score ->
                                        Box(
                                            modifier = Modifier
                                                .size(45.dp)
                                                .clip(CircleShape)
                                                .background(if (score >= 75) Color(0x1F10B981) else Color(0x1FF59E0B)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = "$score",
                                                fontSize = 16.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (score >= 75) EmeraldSuccess else AmberAlert
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
