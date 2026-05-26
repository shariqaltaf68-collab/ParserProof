package com.parserproof.app.data.model

import com.google.gson.annotations.SerializedName

data class CreateProjectRequest(
    val resumeText: String,
    val jobDescription: String,
    val jobTitle: String?,
    val company: String?,
    val tone: String = "professional",
    val length: String = "one-page"
)

data class Project(
    val id: String,
    val title: String,
    val jobTitle: String?,
    val company: String?,
    val resumeText: String,
    val jobDescription: String,
    val improvedResume: String?,
    val coverLetter: String?,
    val interviewQs: String?, // JSON array string
    val skillGap: String?,
    val atsScore: Int?,
    val keywordMatch: String?, // JSON string containing matched/missing
    val status: String,
    val createdAt: String,
    val updatedAt: String
)

data class ProjectResponse(
    val project: Project
)

data class ProjectsListResponse(
    val projects: List<Project>
)

data class KeywordMatchData(
    val matched: List<String> = emptyList(),
    val missing: List<String> = emptyList()
)

data class CohortBands(
    @SerializedName("0-40") val band1: Int = 0,
    @SerializedName("41-60") val band2: Int = 0,
    @SerializedName("61-75") val band3: Int = 0,
    @SerializedName("76-85") val band4: Int = 0,
    @SerializedName("86-100") val band5: Int = 0
)

data class CohortStats(
    val percentile: Int,
    val cohortAverage: Int,
    val cohortTop: Int,
    val totalCandidates: Int,
    val userScore: Int,
    val jobTitle: String,
    val bands: CohortBands
)

data class BattlegroundResponse(
    val success: Boolean,
    val stats: CohortStats
)

data class ResumeUploadResponse(
    val text: String,
    val filename: String,
    val size: Long
)
