package com.parserproof.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.parserproof.app.data.model.CohortStats
import com.parserproof.app.data.model.KeywordMatchData
import com.parserproof.app.data.model.Project
import com.parserproof.app.data.repository.ProjectRepository
import com.parserproof.app.ui.components.AtsScoreMeter
import com.parserproof.app.ui.components.InteractiveChip
import com.parserproof.app.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResultsScreen(
    projectId: String,
    onNavigateBack: () -> Unit,
    onNavigateToChat: (projectId: String) -> Unit
) {
    var project by remember { mutableStateOf<Project?>(null) }
    var cohortStats by remember { mutableStateOf<CohortStats?>(null) }
    var keywordData by remember { mutableStateOf(KeywordMatchData()) }
    var interviewQuestionsList by remember { mutableStateOf<List<Map<String, String>>>(emptyList()) }
    
    var activeTab by remember { mutableStateOf(0) }
    var isLoading by remember { mutableStateOf(true) }
    
    val flippedCardIndices = remember { mutableStateListOf<Int>() }
    
    val projectRepository = remember { ProjectRepository() }
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    LaunchedEffect(projectId) {
        scope.launch {
            val projResult = projectRepository.getProjectDetails(projectId)
            if (projResult.isSuccess) {
                val p = projResult.getOrThrow()
                project = p
                
                p.keywordMatch?.let { kmString ->
                    try {
                        val parsed = Gson().fromJson(kmString, KeywordMatchData::class.java)
                        if (parsed != null) keywordData = parsed
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                p.interviewQs?.let { iqString ->
                    try {
                        val type = object : TypeToken<List<Map<String, String>>>() {}.type
                        val parsed: List<Map<String, String>> = Gson().fromJson(iqString, type)
                        interviewQuestionsList = parsed
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
            
            val battlegroundResult = projectRepository.getBattleground(projectId)
            if (battlegroundResult.isSuccess) {
                cohortStats = battlegroundResult.getOrThrow()
            }
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Optimization Audit", fontWeight = FontWeight.Bold, fontSize = 20.sp) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = TextWhite)
                    }
                },
                actions = {
                    IconButton(onClick = { }) {
                        Icon(imageVector = Icons.Default.Share, contentDescription = "Share", tint = TextWhite)
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
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = PurplePrimary
                )
            } else if (project == null) {
                Text(
                    text = "Project not found or failed to load results.",
                    color = CrimsonError,
                    modifier = Modifier.align(Alignment.Center)
                )
            } else {
                val proj = project!!
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 20.dp)
                        .verticalScroll(scrollState),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Spacer(modifier = Modifier.height(10.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(20.dp)
                    ) {
                        AtsScoreMeter(score = proj.atsScore ?: 60, size = 110.dp, strokeWidth = 9.dp)
                        
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = proj.title,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextWhite
                            )
                            
                            cohortStats?.let { stats ->
                                Text(
                                    text = "Percentile Rank: ${stats.percentile}%",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = EmeraldSuccess
                                )
                                Text(
                                    text = "Cohort Top Score: ${stats.cohortTop}% (Avg: ${stats.cohortAverage}%)",
                                    fontSize = 11.sp,
                                    color = TextMuted
                                )
                            }
                        }
                    }

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateToChat(projectId) },
                        colors = CardDefaults.cardColors(containerColor = Color(0x1F8B5CF6)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "💬 Ask Co-Pilot to edit or explain score gaps...",
                                fontSize = 13.sp,
                                color = PurplePrimary,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Text(
                        text = "Keyword Match Gaps",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite,
                        modifier = Modifier.align(Alignment.Start)
                    )
                    
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        if (keywordData.missing.isNotEmpty()) {
                            Text("Missing Target Phrases:", fontSize = 11.sp, color = CrimsonError, fontWeight = FontWeight.Bold)
                            FlowRow(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                keywordData.missing.forEach { word ->
                                    InteractiveChip(label = word, isMatched = false)
                                }
                            }
                        }
                        if (keywordData.matched.isNotEmpty()) {
                            Text("Matched Target Phrases:", fontSize = 11.sp, color = EmeraldSuccess, fontWeight = FontWeight.Bold)
                            FlowRow(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                keywordData.matched.forEach { word ->
                                    InteractiveChip(label = word, isMatched = true)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    TabRow(
                        selectedTabIndex = activeTab,
                        modifier = Modifier.fillMaxWidth(),
                        containerColor = Color.Transparent
                    ) {
                        listOf("Resume Draft", "Cover Letter", "Interview Prep").forEachIndexed { index, title ->
                            Tab(
                                selected = activeTab == index,
                                onClick = { activeTab = index },
                                text = { Text(title, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    when (activeTab) {
                        0 -> {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = SurfaceCharcoal)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = proj.improvedResume ?: "Generating...",
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 12.sp,
                                        color = TextWhite,
                                        lineHeight = 16.sp
                                    )
                                }
                            }
                        }
                        1 -> {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = SurfaceCharcoal)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = proj.coverLetter ?: "No cover letter generated for this project tier.",
                                        fontSize = 13.sp,
                                        color = TextWhite,
                                        lineHeight = 18.sp
                                    )
                                }
                            }
                        }
                        2 -> {
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                if (interviewQuestionsList.isEmpty()) {
                                    Text("Upgrade plan or select target details to unlock prep cards.", fontSize = 13.sp, color = TextMuted, modifier = Modifier.padding(16.dp))
                                } else {
                                    interviewQuestionsList.forEachIndexed { idx, qMap ->
                                        val isFlipped = flippedCardIndices.contains(idx)
                                        val qText = qMap["question"] ?: ""
                                        val aText = qMap["answer"] ?: ""

                                        Card(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable {
                                                    if (isFlipped) flippedCardIndices.remove(idx)
                                                    else flippedCardIndices.add(idx)
                                                },
                                            colors = CardDefaults.cardColors(
                                                containerColor = if (isFlipped) Color(0x1F8B5CF6) else SurfaceCharcoal
                                            )
                                        ) {
                                            Column(modifier = Modifier.padding(16.dp)) {
                                                Text(
                                                    text = if (isFlipped) "ANSWER:" else "QUESTION:",
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = if (isFlipped) PurplePrimary else TextMuted
                                                )
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = if (isFlipped) aText else qText,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Medium,
                                                    color = TextWhite,
                                                    lineHeight = 18.sp
                                                )
                                                Spacer(modifier = Modifier.height(6.dp))
                                                Text(
                                                    text = if (isFlipped) "Tap to flip back to question" else "Tap card to flip and view recommended answer",
                                                    fontSize = 10.sp,
                                                    color = TextMuted,
                                                    textAlign = TextAlign.End,
                                                    modifier = Modifier.fillMaxWidth()
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(30.dp))
                }
            }
        }
    }
}

@Composable
fun FlowRow(
    modifier: Modifier = Modifier,
    horizontalArrangement: Arrangement.Horizontal = Arrangement.Start,
    verticalArrangement: Arrangement.Vertical = Arrangement.Top,
    content: @Composable () -> Unit
) {
    androidx.compose.ui.layout.Layout(
        content = content,
        modifier = modifier
    ) { measurables, constraints ->
        val placeables = measurables.map { measurable ->
            measurable.measure(constraints.copy(minWidth = 0))
        }

        val rows = mutableListOf<List<androidx.compose.ui.layout.Placeable>>()
        var currentRow = mutableListOf<androidx.compose.ui.layout.Placeable>()
        var currentRowWidth = 0

        placeables.forEach { placeable ->
            if (currentRowWidth + placeable.width > constraints.maxWidth && currentRow.isNotEmpty()) {
                rows.add(currentRow)
                currentRow = mutableListOf()
                currentRowWidth = 0
            }
            currentRow.add(placeable)
            currentRowWidth += placeable.width + horizontalArrangement.spacing.roundToPx()
        }
        if (currentRow.isNotEmpty()) {
            rows.add(currentRow)
        }

        var width = 0
        var height = 0
        rows.forEachIndexed { index, row ->
            width = maxOf(width, row.sumOf { it.width } + (row.size - 1) * horizontalArrangement.spacing.roundToPx())
            height += row.maxOf { it.height } + if (index > 0) verticalArrangement.spacing.roundToPx() else 0
        }

        layout(width.coerceIn(constraints.minWidth, constraints.maxWidth), height.coerceIn(constraints.minHeight, constraints.maxHeight)) {
            var y = 0
            rows.forEach { row ->
                var x = 0
                val rowHeight = row.maxOf { it.height }
                row.forEach { placeable ->
                    placeable.placeRelative(x, y)
                    x += placeable.width + horizontalArrangement.spacing.roundToPx()
                }
                y += rowHeight + verticalArrangement.spacing.roundToPx()
            }
        }
    }
}
