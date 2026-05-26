package com.parserproof.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val ParserProofColorScheme = darkColorScheme(
    primary = PurplePrimary,
    onPrimary = TextWhite,
    secondary = EmeraldSuccess,
    onSecondary = BackgroundMatte,
    background = BackgroundMatte,
    onBackground = TextWhite,
    surface = SurfaceCharcoal,
    onSurface = TextWhite,
    error = CrimsonError,
    onError = TextWhite
)

@Composable
fun ParserProofTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = ParserProofColorScheme,
        typography = ParserProofTypography,
        content = content
    )
}
