import data from '@/lib/data'
import { connectToDatabase } from '.'
import { Quiz } from './models/quiz.model'
import { Question } from './models/question.model'
import { User } from './models/user.model'
import { Review } from './models/review.model'
import { Leaderboard } from './models/leaderboard.model'
import { cwd } from 'process'
import { loadEnvConfig } from '@next/env'
import mongoose from 'mongoose'

loadEnvConfig(cwd())

const seedToDatabase = async () => {
  try {
    console.log('Starting full database seeding...')

    // Connect
    console.log('Connecting to database...')
    await connectToDatabase(process.env.MONGODB_URI!)

    // ─── Optional: Clean previous data (uncomment when needed) ───────────────
    console.log('Clearing existing data...')
    await Promise.all([
      Quiz.deleteMany({}),
      Question.deleteMany({}),
      User.deleteMany({}),
      Review.deleteMany({}),
      Leaderboard.deleteMany({}),
    ])

    if (!data.users || !Array.isArray(data.users) || data.users.length === 0) {
      console.warn('No users found in data – skipping user seeding')
    } else {
      console.log(`Seeding ${data.users.length} users...`)
      await User.deleteMany({}) // optional cleanup
      const insertedUsers = await User.insertMany(data.users)
      console.log(`Inserted ${insertedUsers.length} users`)
    }

    // ─── 2. Seed Questions & Quizzes (multiple) ───────────────────────────────
    if (
      !data.quizzes ||
      !Array.isArray(data.quizzes) ||
      data.quizzes.length === 0
    ) {
      throw new Error('No quizzes array found in data')
    }

    if (
      !data.questions ||
      !Array.isArray(data.questions) ||
      data.questions.length === 0
    ) {
      throw new Error('No questions found in data')
    }

    console.log(
      `Seeding ${data.quizzes.length} quizzes with total ${data.questions.length} questions...`,
    )

    for (const quizInfo of data.quizzes) {
      const { name, ...quizBase } = quizInfo

      // Find all questions that belong to this quiz (by quizName)
      const quizQuestions = data.questions.filter((q) => q.quizName === name)

      if (quizQuestions.length === 0) {
        console.warn(`No questions found for quiz "${name}" – skipping`)
        continue
      }

      if (quizQuestions.length !== 10) {
        console.warn(
          `Expected 10 questions for "${name}", found ${quizQuestions.length}`,
        )
      }

      console.log(
        `Inserting ${quizQuestions.length} questions for "${name}"...`,
      )
      await Question.deleteMany({ quizName: name }) // optional cleanup for this quiz
      const insertedQuestions = await Question.insertMany(quizQuestions)

      console.log(
        `Creating quiz "${name}" with ${insertedQuestions.length} question references...`,
      )
      const quizData = {
        name,
        ...quizBase,
        questions: insertedQuestions.map((q) => q._id),
      }

      await Quiz.deleteMany({ name }) // optional cleanup
      const createdQuiz = await Quiz.create(quizData)

      console.log(
        `→ Created quiz: ${createdQuiz.name} (${createdQuiz.questions.length} questions)`,
      )
    }

    // ─── 3. Seed Reviews (lookup quiz by name, user by email) ─────────────────
    if (
      !data.reviews ||
      !Array.isArray(data.reviews) ||
      data.reviews.length === 0
    ) {
      console.warn('No reviews found in data – skipping')
    } else {
      console.log(`Seeding ${data.reviews.length} reviews...`)

      const reviewData = await Promise.all(
        data.reviews.map(async (review) => {
          const quiz = await Quiz.findOne({ name: review.quizName })
          const user = await User.findOne({ email: review.userEmail })

          if (!quiz || !user) {
            console.warn(
              `Skipping review: missing quiz "${review.quizName}" or user "${review.userEmail}"`,
            )
            return null
          }

          return {
            ...review,
            quiz: quiz._id,
            user: user._id,
          }
        }),
      )

      const validReviews = reviewData.filter(Boolean)

      if (validReviews.length > 0) {
        await Review.deleteMany({}) // optional cleanup
        await Review.insertMany(validReviews)
        console.log(`Inserted ${validReviews.length} reviews`)
      }
    }

    // ─── 4. Seed Leaderboard Entries (lookup user by email) ───────────────────
    if (
      !data.leaderboardEntries ||
      !Array.isArray(data.leaderboardEntries) ||
      data.leaderboardEntries.length === 0
    ) {
      console.warn('No leaderboard entries found – skipping')
    } else {
      console.log(
        `Seeding ${data.leaderboardEntries.length} leaderboard entries...`,
      )

      const leaderboardData = await Promise.all(
        data.leaderboardEntries.map(async (entry) => {
          const user = await User.findOne({ email: entry.userEmail })

          if (!user) {
            console.warn(
              `Skipping leaderboard entry: missing user "${entry.userEmail}"`,
            )
            return null
          }

          return {
            ...entry,
            user: user._id,
          }
        }),
      )

      const validEntries = leaderboardData.filter(Boolean)

      if (validEntries.length > 0) {
        await Leaderboard.deleteMany({}) // optional cleanup
        await Leaderboard.insertMany(validEntries)
        console.log(`Inserted ${validEntries.length} leaderboard entries`)
      }
    }

    // ─── Finalize ─────────────────────────────────────────────────────────────
    console.log('Seeding completed successfully!')
    await mongoose.connection.close()
    console.log('Database connection closed')
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:', error)
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close().catch(() => {})
    }
    process.exit(1)
  }
}

seedToDatabase()
