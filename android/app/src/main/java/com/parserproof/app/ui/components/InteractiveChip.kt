package com.parserproof.app.ui.components

import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.parserproof.app.ui.theme.CrimsonError
import com.parserproof.app.ui.theme.EmeraldSuccess
import com.parserproof.app.ui.theme.TextSecondary
import com.parserproof.app.ui.theme.TextWhite

@Composable
fun InteractiveChip(
    label: String,
    isMatched: Boolean,
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val backgroundColor = if (isMatched) Color(0x1F10B981) else Color(0x1FEF4444)
    val borderColor = if (isMatched) EmeraldSuccess else CrimsonError
    val icon = if (isMatched) Icons.Default.Check else Icons.Default.Warning

    Surface(
        modifier = modifier
            .clickable(onClick = onClick)
            .border(1.dp, borderColor, RoundedCornerShape(20.dp)),
        color = backgroundColor,
        shape = RoundedCornerShape(20.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = borderColor,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = label,
                fontSize = 13.sp,
                color = TextWhite,
                lineHeight = 16.sp
            )
        }
    }
}
