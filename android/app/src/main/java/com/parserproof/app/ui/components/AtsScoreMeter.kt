package com.parserproof.app.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.parserproof.app.ui.theme.EmeraldSuccess
import com.parserproof.app.ui.theme.PurplePrimary
import com.parserproof.app.ui.theme.TextWhite

@Composable
fun AtsScoreMeter(
    score: Int,
    modifier: Modifier = Modifier,
    size: Dp = 140.dp,
    strokeWidth: Dp = 12.dp
) {
    var animationTriggered by remember { mutableStateOf(false) }
    
    val targetSweep = (score.toFloat() / 100f) * 360f
    val animatedSweep by animateFloatAsState(
        targetValue = if (animationTriggered) targetSweep else 0f,
        animationSpec = tween(durationMillis = 1200),
        label = "ATS Score Ring Animation"
    )

    LaunchedEffect(Unit) {
        animationTriggered = true
    }

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                color = Color(0x1AFFFFFF),
                radius = (size.toPx() - strokeWidth.toPx()) / 2f,
                style = Stroke(width = strokeWidth.toPx())
            )

            val sweepGradient = Brush.sweepGradient(
                colors = listOf(PurplePrimary, EmeraldSuccess, PurplePrimary)
            )

            drawArc(
                brush = sweepGradient,
                startAngle = -90f,
                sweepAngle = animatedSweep,
                useCenter = false,
                style = Stroke(
                    width = strokeWidth.toPx(),
                    cap = StrokeCap.Round
                ),
                size = this.size.copy(
                    width = size.toPx() - strokeWidth.toPx(),
                    height = size.toPx() - strokeWidth.toPx()
                ),
                topLeft = androidx.compose.ui.geometry.Offset(
                    strokeWidth.toPx() / 2f,
                    strokeWidth.toPx() / 2f
                )
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "$score",
                fontSize = 38.sp,
                fontWeight = FontWeight.Bold,
                color = TextWhite
            )
            Text(
                text = "ATS SCORE",
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = EmeraldSuccess,
                letterSpacing = 1.sp
            )
        }
    }
}
