package com.parserproof.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.parserproof.app.data.model.AssistantChatRequest
import com.parserproof.app.data.model.ChatMessage
import com.parserproof.app.data.repository.AssistantRepository
import com.parserproof.app.ui.components.InlineGatingCard
import com.parserproof.app.ui.components.VoiceStateWave
import com.parserproof.app.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatAssistantScreen(
    projectId: String?,
    onNavigateBack: () -> Unit,
    onNavigateToAuth: () -> Unit
) {
    val activeProjectId = if (projectId == "new" || projectId == "null") null else projectId
    
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()
    val assistantRepository = remember { AssistantRepository() }
    
    val chatMessages = remember { mutableStateListOf<ChatMessage>() }
    var inputText by remember { mutableStateOf("") }
    
    var isLimitReached by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    
    var isVoiceActive by remember { mutableStateOf(false) }
    var voiceStateName by remember { mutableStateOf("Listening") }

    LaunchedEffect(Unit) {
        scope.launch {
            val historyResult = assistantRepository.getAssistantHistory()
            if (historyResult.isSuccess) {
                val history = historyResult.getOrThrow()
                chatMessages.addAll(history.messages)
                if (history.remainingMessages <= 0 && history.isGuest) {
                    isLimitReached = true
                }
            } else {
                chatMessages.add(
                    ChatMessage(
                        role = "assistant",
                        content = "Hello! I am your ParserProof Copilot. Ask me SDE bullet rewrites or details about ATS parsing compatibility."
                    )
                )
            }
            
            if (chatMessages.isNotEmpty()) {
                listState.animateScrollToItem(chatMessages.size - 1)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Co-Pilot Assistant", fontWeight = FontWeight.Bold, fontSize = 20.sp) },
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
            Column(modifier = Modifier.fillMaxSize()) {
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item { Spacer(modifier = Modifier.height(10.dp)) }
                    
                    itemsIndexed(chatMessages) { index, msg ->
                        val isUser = msg.role == "user"
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
                        ) {
                            Box(
                                modifier = Modifier
                                    .widthIn(max = 280.dp)
                                    .clip(
                                        RoundedCornerShape(
                                            topStart = 12.dp,
                                            topEnd = 12.dp,
                                            bottomStart = if (isUser) 12.dp else 0.dp,
                                            bottomEnd = if (isUser) 0.dp else 12.dp
                                        )
                                    )
                                    .background(if (isUser) PurplePrimary else SurfaceCharcoal)
                                    .padding(12.dp)
                            ) {
                                Text(
                                    text = msg.content,
                                    fontSize = 14.sp,
                                    color = TextWhite,
                                    lineHeight = 19.sp
                                )
                            }
                        }
                    }

                    if (isLimitReached) {
                        item {
                            InlineGatingCard(
                                onLoginClick = onNavigateToAuth,
                                onSignupClick = onNavigateToAuth,
                                modifier = Modifier.padding(vertical = 10.dp)
                            )
                        }
                    }

                    if (isLoading) {
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Start
                            ) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(SurfaceCharcoal)
                                        .padding(12.dp)
                                ) {
                                    CircularProgressIndicator(
                                        color = PurplePrimary,
                                        modifier = Modifier.size(18.dp),
                                        strokeWidth = 2.dp
                                    )
                                }
                            }
                        }
                    }
                    
                    item { Spacer(modifier = Modifier.height(10.dp)) }
                }

                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = SurfaceCharcoal,
                    tonalElevation = 4.dp
                ) {
                    Row(
                        modifier = Modifier
                            .padding(12.dp)
                            .navigationBarsPadding()
                            .imePadding(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        IconButton(
                            onClick = {
                                if (!isLimitReached && !isLoading) {
                                    isVoiceActive = true
                                    scope.launch {
                                        voiceStateName = "Listening"
                                        delay(2500)
                                        voiceStateName = "Processing"
                                        delay(1500)
                                        voiceStateName = "Speaking"
                                        
                                        inputText = "Review technical keyword densities in skills"
                                        isVoiceActive = false
                                    }
                                }
                            },
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape),
                            colors = IconButtonDefaults.iconButtonColors(
                                containerColor = if (isVoiceActive) EmeraldSuccess else Color(0x1AFFFFFF)
                            ),
                            enabled = !isLimitReached
                        ) {
                            Icon(
                                imageVector = Icons.Default.PlayArrow,
                                contentDescription = "Voice",
                                tint = if (isVoiceActive) BackgroundMatte else TextWhite
                            )
                        }

                        OutlinedTextField(
                            value = inputText,
                            onValueChange = { inputText = it },
                            placeholder = { Text(if (isLimitReached) "Limit reached. Please register..." else "Ask Copilot...") },
                            modifier = Modifier.weight(1f),
                            maxLines = 3,
                            shape = RoundedCornerShape(20.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = PurplePrimary,
                                unfocusedBorderColor = Color(0x3CFFFFFF)
                            ),
                            enabled = !isLimitReached
                        )

                        IconButton(
                            onClick = {
                                val messageToSend = inputText.trim()
                                if (messageToSend.isNotEmpty()) {
                                    inputText = ""
                                    chatMessages.add(ChatMessage(role = "user", content = messageToSend))
                                    isLoading = true
                                    
                                    scope.launch {
                                        listState.animateScrollToItem(chatMessages.size - 1)
                                        
                                        val req = AssistantChatRequest(
                                            message = messageToSend,
                                            projectId = activeProjectId,
                                            history = chatMessages.toList()
                                        )
                                        val result = assistantRepository.chatWithAssistant(req)
                                        isLoading = false
                                        
                                        if (result.isSuccess) {
                                            val response = result.getOrThrow()
                                            chatMessages.add(ChatMessage(role = "assistant", content = response.response))
                                            if (response.remainingMessages <= 0 && response.isGuest) {
                                                isLimitReached = true
                                            }
                                        } else {
                                            val err = result.exceptionOrNull()?.message ?: "Failed to process co-pilot query."
                                            if (err.contains("limit_reached") || err.contains("limit")) {
                                                isLimitReached = true
                                            } else {
                                                chatMessages.add(ChatMessage(role = "assistant", content = err))
                                            }
                                        }
                                        listState.animateScrollToItem(chatMessages.size - 1)
                                    }
                                }
                            },
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape),
                            colors = IconButtonDefaults.iconButtonColors(
                                containerColor = if (inputText.trim().isEmpty() || isLimitReached) Color(0x1AFFFFFF) else PurplePrimary
                            ),
                            enabled = inputText.trim().isNotEmpty() && !isLimitReached
                        ) {
                            Icon(
                                imageVector = Icons.Default.Send,
                                contentDescription = "Send",
                                tint = if (inputText.trim().isEmpty() || isLimitReached) TextMuted else TextWhite
                            )
                        }
                    }
                }
            }

            if (isVoiceActive) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0x80000000))
                        .clickable { isVoiceActive = false }
                        .padding(24.dp),
                    contentAlignment = Alignment.BottomCenter
                ) {
                    VoiceStateWave(
                        stateName = voiceStateName,
                        modifier = Modifier.padding(bottom = 60.dp)
                    )
                }
            }
        }
    }
}
