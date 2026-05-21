import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { getCpdPartPageData } from '@/lib/actions/quizAttempt.cpd-part'
import { QuizResultAnswerCard } from '@/components/results/quiz-result-answer-card'
import {
  Zap,
  Gem,
  CheckCircle2,
  XCircle,
  Trophy,
  ChevronRight,
} from 'lucide-react'

type PageProps = {
  params: Promise<{ attemptId: string; partIndex: string }>
}

function pct(n: number) {
  return Math.round(n)
}

function zoneLabel(percentage: number): { label: string; color: string } {
  if (percentage >= 80)
    return {
      label: 'Excellent',
      color: 'text-emerald-600 dark:text-emerald-400',
    }
  if (percentage >= 60)
    return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' }
  return {
    label: 'Needs Practice',
    color: 'text-amber-600 dark:text-amber-400',
  }
}

export default async function CpdPartResultPage({ params }: PageProps) {
  const { attemptId, partIndex: partIndexStr } = await params
  const partIndex = Number(partIndexStr)

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/cpd/attempt/${attemptId}/part/${partIndex}`)
  }

  const data = await getCpdPartPageData({
    attemptId,
    userId: session.user.id,
    partIndex,
  })

  const {
    partNumber,
    totalParts,
    isLastPart,
    canRedo,
    quiz,
    partSummary,
    answers,
    allCompletedParts,
    overallXp,
    overallGems,
    overallScore,
    overallMaxScore,
    overallPercentage,
  } = data

  const zone = zoneLabel(partSummary.percentage)
  const correctCount = answers.filter((a) => a.isCorrect).length

  return (
    <main className='mx-auto max-w-2xl px-4 py-8 space-y-8'>
      {/* ── Part header ── */}
      <div className='text-center space-y-1'>
        <p className='text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
          {quiz.name}
        </p>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
          Part {partNumber} of {totalParts}
          {isLastPart && ' — Final Part'}
        </h1>
      </div>

      {/* ── Part summary card ── */}
      <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-4'>
        {/* Score ring */}
        <div className='flex flex-col items-center gap-1'>
          <div className='text-5xl font-extrabold text-slate-900 dark:text-slate-50'>
            {pct(partSummary.percentage)}%
          </div>
          <p className={`text-sm font-semibold ${zone.color}`}>{zone.label}</p>
          <p className='text-slate-500 dark:text-slate-400 text-sm'>
            {partSummary.score} / {partSummary.maxScore} pts
          </p>
        </div>

        {/* Stats row */}
        <div className='grid grid-cols-4 gap-3 pt-2'>
          <StatCell
            icon={<CheckCircle2 className='text-emerald-500' size={18} />}
            label='Correct'
            value={String(correctCount)}
          />
          <StatCell
            icon={<XCircle className='text-red-400' size={18} />}
            label='Wrong'
            value={String(answers.length - correctCount)}
          />
          <StatCell
            icon={<Zap className='text-yellow-400' size={18} />}
            label='XP'
            value={`+${partSummary.xpEarned}`}
          />
          <StatCell
            icon={<Gem className='text-blue-400' size={18} />}
            label='Gems'
            value={`+${partSummary.gemsEarned}`}
          />
        </div>
      </div>

      {/* ── Overall summary (last part only) ── */}
      {isLastPart && (
        <div className='rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-6 space-y-4'>
          <div className='flex items-center gap-2'>
            <Trophy className='text-emerald-500' size={22} />
            <h2 className='text-lg font-bold text-emerald-800 dark:text-emerald-300'>
              Quiz Complete!
            </h2>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <StatCell
              icon={<Zap className='text-yellow-400' size={18} />}
              label='Total XP'
              value={`+${overallXp}`}
              large
            />
            <StatCell
              icon={<Gem className='text-blue-400' size={18} />}
              label='Total Gems'
              value={`+${overallGems}`}
              large
            />
            <StatCell
              icon={<CheckCircle2 className='text-emerald-500' size={18} />}
              label='Overall Score'
              value={`${overallScore}/${overallMaxScore}`}
              large
            />
            <StatCell
              icon={<Trophy className='text-emerald-500' size={18} />}
              label='Overall'
              value={`${pct(overallPercentage)}%`}
              large
            />
          </div>

          {/* Per-part breakdown table */}
          <div className='mt-4 overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead>
                <tr className='text-slate-500 dark:text-slate-400 border-b border-emerald-200 dark:border-emerald-800'>
                  <th className='pb-2 font-medium'>Part</th>
                  <th className='pb-2 font-medium'>Score</th>
                  <th className='pb-2 font-medium'>%</th>
                  <th className='pb-2 font-medium'>XP</th>
                  <th className='pb-2 font-medium'>Gems</th>
                </tr>
              </thead>
              <tbody>
                {allCompletedParts.map((p) => (
                  <tr
                    key={p.partKey}
                    className='border-b border-emerald-100 dark:border-emerald-900/40 last:border-0'
                  >
                    <td className='py-1.5 font-medium'>{p.partNumber}</td>
                    <td className='py-1.5'>
                      {p.score}/{p.maxScore}
                    </td>
                    <td className='py-1.5'>{pct(p.percentage)}%</td>
                    <td className='py-1.5'>+{p.xpEarned}</td>
                    <td className='py-1.5'>+{p.gemsEarned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CTAs ── */}
      <div className='flex flex-wrap gap-3'>
        {isLastPart ? (
          <Link
            href={`/cpd/attempt/${attemptId}/result`}
            className='flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-5 transition-colors'
          >
            <Trophy size={18} />
            View Full Results
          </Link>
        ) : (
          <Link
            href={`/cpd/attempt/${attemptId}`}
            className='flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 transition-colors'
          >
            Continue to Part {partNumber + 1}
            <ChevronRight size={18} />
          </Link>
        )}

        {canRedo && (
          <form
            method='POST'
            action={`/cpd/attempt/${attemptId}/part/${partIndex}/redo`}
          >
            <button
              type='submit'
              className='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-3 px-5 transition-colors'
            >
              Redo Part {partNumber}
            </button>
          </form>
        )}
      </div>

      {/* ── Per-question review ── */}
      <section className='space-y-4'>
        <h2 className='text-lg font-semibold text-slate-800 dark:text-slate-200'>
          Question Review
        </h2>
        {answers.map((answer, i) => (
          <QuizResultAnswerCard
            key={answer.questionId}
            answer={answer}
            index={(partSummary.maxScore / 10) * partIndex + i}
            attemptId={attemptId}
          />
        ))}
      </section>
    </main>
  )
}

function StatCell({
  icon,
  label,
  value,
  large,
}: {
  icon: React.ReactNode
  label: string
  value: string
  large?: boolean
}) {
  return (
    <div className='flex flex-col items-center gap-1 rounded-xl bg-slate-50 dark:bg-slate-800/50 py-3 px-2'>
      {icon}
      <span
        className={`font-bold text-slate-900 dark:text-slate-50 ${large ? 'text-lg' : 'text-base'}`}
      >
        {value}
      </span>
      <span className='text-xs text-slate-500 dark:text-slate-400'>
        {label}
      </span>
    </div>
  )
}
