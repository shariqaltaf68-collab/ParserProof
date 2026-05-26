package com.parserproof.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.parserproof.app.ui.theme.EmeraldSuccess
import com.parserproof.app.ui.theme.PurplePrimary
import com.parserproof.app.ui.theme.TextWhite

@Composable
fun VoiceStateWave(
    stateName: String,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "Waveform infinite transition")

    val heights = listOf(
        infiniteTransition.animateFloat(
            initialValue = 0.2f, targetValue = 0.9f,
            animationSpec = infiniteRepeatable(tween(450, easing = LinearEasing), RepeatMode.Reverse), label = "Bar1"
        ),
        infiniteTransition.animateFloat(
            initialValue = 0.3f, targetValue = 0.7f,
            animationSpec = infiniteRepeatable(tween(350, easing = LinearEasing), RepeatMode.Reverse), label = "Bar2"
        ),
        infiniteTransition.animateFloat(
            initialValue = 0.1f, targetValue = 0.95f,
            animationSpec = infiniteRepeatable(tween(550, easing = LinearEasing), RepeatMode.Reverse), label = "Bar3"
        ),
        infiniteTransition.animateFloat(
            initialValue = 0.4f, targetValue = 0.6f,
            animationSpec = infiniteRepeatable(tween(300, easing = LinearEasing), RepeatMode.Reverse), label = "Bar4"
        ),
        infiniteTransition.animateFloat(
            initialValue = 0.2f, targetValue = 0.85f,
            animationSpec = infiniteRepeatable(tween(400, easing = LinearEasing), RepeatMode.Reverse), label = "Bar5"
        )
    )

    Surface(
        modifier = modifier.fillMaxWidth(),
        color = Color(0xBF000000),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.width(120.dp).fillMaxHeight()) {
                    val barWidth = 8.dp.toPx()
                    val spacing = 6.dp.toPx()
                    val totalWidth = (barWidth * 5) + (spacing * 4)
                    val startX = (size.width - totalWidth) / 2f

                    for (i in 0 until 5) {
                        val scale = heights[i].value
                        val barHeight = size.height * scale
                        val x = startX + i * (barWidth + spacing)
                        val y = (size.height - barHeight) / 2f

                        drawRoundRect(
                            color = if (stateName == "Listening") EmeraldSuccess else PurplePrimary,
                            topLeft = Offset(x, y),
                            size = Size(barWidth, barHeight),
                            cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx())
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(
                text = stateName.uppercase(),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = TextWhite,
                letterSpacing = 1.5.sp
            )
        }
    }
}
