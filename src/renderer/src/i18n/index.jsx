import { createContext, useContext, useState } from 'react'

const translations = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      income: 'Income',
      expenses: 'Expenses',
      subscriptions: 'Subscriptions',
      savingsGoals: 'Savings Goals',
      appName: 'Budget Tracker'
    },
    common: {
      edit: 'Edit',
      delete: 'Delete',
      cancel: 'Cancel',
      active: 'Active',
      paused: 'Paused',
      loading: 'Loading…',
      today: 'Today',
      overdue: 'Overdue',
      inDays: 'In {n}d',
      optional: 'optional',
      date: 'Date',
      description: 'Description',
      category: 'Category',
      note: 'Note',
      amount: 'Amount ($)'
    },
    dashboard: {
      remaining: 'Remaining',
      monthlyIncome: 'Monthly Income',
      expenses: 'Expenses',
      subscriptionsMo: 'Subscriptions/mo',
      monthlyBudget: 'Monthly Budget',
      projectedBudget: 'Projected Budget',
      remainingAmt: '${amount} remaining ({pct}%)',
      overBudget: '${amount} over budget',
      projected: 'Projected',
      savingsProgress: 'Savings Progress',
      noExpensesMonth: 'No expenses this month.',
      noExpensesFuture: 'No expenses logged yet for this month.',
      noSpendingData: 'No spending data for this month.',
      byCategory: '{month} by Category',
      recentExpenses: '{month} Expenses'
    },
    income: {
      title: 'Income',
      addBtn: '+ Add Income',
      monthlyTotal: 'Monthly Total',
      yearlyTotal: 'Yearly Total',
      activeSources: 'Active Sources',
      addModal: 'Add Income Source',
      editModal: 'Edit Income Source',
      submitAdd: 'Add Income',
      submitEdit: 'Update',
      nameLabel: 'Name',
      namePlaceholder: 'e.g. Main Job, Side Hustle',
      frequency: 'Frequency',
      sourceType: 'Source Type',
      nextPaymentDate: 'Next Payment Date',
      nextPayment: 'Next payment',
      recurring: 'recurring',
      noIncome: "No income sources yet.\nClick '+ Add Income' to set up your recurring income.",
      perWeek: '/week',
      perFortnight: '/fortnight',
      perMonth: '/month',
      approxPerMonth: '≈ ${n}/month'
    },
    frequencies: {
      weekly: 'Weekly',
      fortnightly: 'Fortnightly',
      monthly: 'Monthly'
    },
    sources: {
      Salary: 'Salary',
      Freelance: 'Freelance',
      Business: 'Business',
      Investment: 'Investment',
      Rental: 'Rental',
      Other: 'Other'
    },
    expenses: {
      title: 'Expenses',
      importCsv: 'Import CSV',
      addBtn: '+ Add Expense',
      allCategories: 'All Categories',
      allTime: 'All Time',
      editModal: 'Edit Expense',
      addModal: 'Add Expense',
      submitEdit: 'Update Expense',
      submitAdd: 'Add Expense',
      descriptionPlaceholder: 'e.g. Grocery shopping',
      noteLabel: 'Note (optional)',
      notePlaceholder: 'Any additional notes…',
      noExpenses: "No expenses yet.\nClick '+ Add Expense' to get started.",
      noExpensesFilter: 'No expenses match your filters.',
      importSuccess: '✓ {n} expense{s} imported from CSV'
    },
    categories: {
      'Food & Dining': 'Food & Dining',
      Transportation: 'Transportation',
      Housing: 'Housing',
      Entertainment: 'Entertainment',
      Healthcare: 'Healthcare',
      Shopping: 'Shopping',
      Education: 'Education',
      Other: 'Other'
    },
    subscriptions: {
      title: 'Subscriptions',
      addBtn: '+ Add Subscription',
      monthlyCost: 'Monthly Cost',
      yearlyCost: 'Yearly Cost',
      dueThisWeek: 'Due This Week',
      addModal: 'Add Subscription',
      editModal: 'Edit Subscription',
      submitAdd: 'Add Subscription',
      serviceNameLabel: 'Service Name',
      serviceNamePlaceholder: 'e.g. Netflix',
      billingCycle: 'Billing Cycle',
      nextBillingDate: 'Next Billing Date',
      nextBilling: 'Next billing',
      markPaid: '✓ Mark Paid',
      noSubscriptions: "No subscriptions yet.\nClick '+ Add Subscription' to track your recurring expenses.",
      perWk: '/wk',
      perMo: '/mo',
      perQtr: '/qtr',
      perYr: '/yr'
    },
    cycles: {
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly'
    },
    subCategories: {
      Entertainment: 'Entertainment',
      Software: 'Software',
      Music: 'Music',
      'News & Media': 'News & Media',
      'Food & Dining': 'Food & Dining',
      'Fitness & Health': 'Fitness & Health',
      Education: 'Education',
      'Cloud Storage': 'Cloud Storage',
      Shopping: 'Shopping',
      Other: 'Other'
    },
    goals: {
      title: 'Savings Goals',
      addBtn: '+ Add Goal',
      goalNameLabel: 'Goal Name',
      goalNamePlaceholder: 'e.g. Emergency Fund',
      targetAmountLabel: 'Target Amount ($)',
      currentSavingsLabel: 'Current Savings ($)',
      targetDateLabel: 'Target Date (optional)',
      colorLabel: 'Color',
      addModal: 'New Savings Goal',
      editModal: 'Edit Goal',
      submitAdd: 'Add Goal',
      submitEdit: 'Update Goal',
      addContributionBtn: '+ Add Contribution',
      contributionModal: 'Add Contribution',
      contributionAmountLabel: 'Contribution Amount ($)',
      submitContribution: 'Add Contribution',
      byLabel: 'By',
      ofGoal: 'of ${n} goal',
      remaining: '· ${n} remaining',
      pctComplete: '{pct}% complete',
      left: '${n} left',
      done: '✓ Done',
      noGoals: "No savings goals yet.\nClick '+ Add Goal' to set up your first goal."
    },
    csv: {
      title: 'Import from CSV',
      step1: 'Step 1 of 2 — Upload your bank export and map the columns',
      step2: 'Step 2 of 2 — Review transactions before importing',
      clickToSelect: 'Click to select your bank CSV',
      bankHint: 'CBA · ANZ · NAB · Westpac · Up Bank · most Australian banks',
      rowsMeta: '{rows} rows · {cols} columns · click to change',
      amountFormat: 'Amount format',
      singleAmount: 'Single amount column',
      separateDebitCredit: 'Separate debit / credit columns (Westpac)',
      dateColumn: 'Date column',
      descriptionColumn: 'Description column',
      amountColumn: 'Amount column',
      negativeHint: '— negative values are treated as expenses',
      debitColumn: 'Debit column',
      debitHint: '— expenses',
      creditColumn: 'Credit column',
      creditSkipped: 'income not imported',
      previewBtn: 'Preview →',
      backBtn: '← Back',
      importing: 'Importing…',
      importBtn: 'Import {n} expense{s}',
      selectAll: 'Select all',
      none: 'None',
      selectedOf: '{n} of {m} transactions selected',
      noTransactions: 'No expense transactions found with the current mapping.\nGo back and check your column selection.',
      dupNotice: '{n} duplicate{s} found and pre-deselected — these match expenses already in your records',
      dupBadge: 'duplicate',
      headerlessNotice: 'No column headers detected — columns mapped by position (CommBank format). Adjust below if needed.',
      selectPrompt: '— select —'
    }
  },
  ko: {
    nav: {
      dashboard: '대시보드',
      income: '수입',
      expenses: '지출',
      subscriptions: '구독',
      savingsGoals: '저축 목표',
      appName: '가계부'
    },
    common: {
      edit: '수정',
      delete: '삭제',
      cancel: '취소',
      active: '활성',
      paused: '일시 중지',
      loading: '로딩 중…',
      today: '오늘',
      overdue: '연체',
      inDays: '{n}일 후',
      optional: '선택사항',
      date: '날짜',
      description: '설명',
      category: '카테고리',
      note: '메모',
      amount: '금액 ($)'
    },
    dashboard: {
      remaining: '남은 금액',
      monthlyIncome: '월 수입',
      expenses: '지출',
      subscriptionsMo: '구독/월',
      monthlyBudget: '월 예산',
      projectedBudget: '예상 예산',
      remainingAmt: '${amount} 남음 ({pct}%)',
      overBudget: '${amount} 예산 초과',
      projected: '예상',
      savingsProgress: '저축 현황',
      noExpensesMonth: '이번 달 지출 내역이 없습니다.',
      noExpensesFuture: '이번 달 지출 내역이 아직 없습니다.',
      noSpendingData: '이번 달 지출 데이터가 없습니다.',
      byCategory: '{month} 카테고리별',
      recentExpenses: '{month} 지출'
    },
    income: {
      title: '수입',
      addBtn: '+ 수입 추가',
      monthlyTotal: '월 합계',
      yearlyTotal: '연간 합계',
      activeSources: '활성 소스',
      addModal: '수입 원천 추가',
      editModal: '수입 원천 수정',
      submitAdd: '수입 추가',
      submitEdit: '업데이트',
      nameLabel: '이름',
      namePlaceholder: '예: 본업, 부업',
      frequency: '빈도',
      sourceType: '소득 유형',
      nextPaymentDate: '다음 지급일',
      nextPayment: '다음 지급',
      recurring: '반복',
      noIncome: "'+ 수입 추가'를 클릭하여\n반복 수입을 설정하세요.",
      perWeek: '/주',
      perFortnight: '/격주',
      perMonth: '/월',
      approxPerMonth: '≈ ${n}/월'
    },
    frequencies: {
      weekly: '주간',
      fortnightly: '격주',
      monthly: '월간'
    },
    sources: {
      Salary: '급여',
      Freelance: '프리랜서',
      Business: '사업',
      Investment: '투자',
      Rental: '임대',
      Other: '기타'
    },
    expenses: {
      title: '지출',
      importCsv: 'CSV 가져오기',
      addBtn: '+ 지출 추가',
      allCategories: '전체 카테고리',
      allTime: '전체 기간',
      editModal: '지출 수정',
      addModal: '지출 추가',
      submitEdit: '지출 업데이트',
      submitAdd: '지출 추가',
      descriptionPlaceholder: '예: 장보기',
      noteLabel: '메모 (선택사항)',
      notePlaceholder: '추가 메모…',
      noExpenses: "'+ 지출 추가'를 클릭하여\n지출 내역을 추가하세요.",
      noExpensesFilter: '필터에 맞는 지출이 없습니다.',
      importSuccess: '✓ CSV에서 지출 {n}개를 가져왔습니다'
    },
    categories: {
      'Food & Dining': '식비',
      Transportation: '교통',
      Housing: '주거',
      Entertainment: '엔터테인먼트',
      Healthcare: '의료',
      Shopping: '쇼핑',
      Education: '교육',
      Other: '기타'
    },
    subscriptions: {
      title: '구독',
      addBtn: '+ 구독 추가',
      monthlyCost: '월 비용',
      yearlyCost: '연간 비용',
      dueThisWeek: '이번 주 예정',
      addModal: '구독 추가',
      editModal: '구독 수정',
      submitAdd: '구독 추가',
      serviceNameLabel: '서비스 이름',
      serviceNamePlaceholder: '예: Netflix',
      billingCycle: '청구 주기',
      nextBillingDate: '다음 청구일',
      nextBilling: '다음 청구',
      markPaid: '✓ 결제 완료',
      noSubscriptions: "'+ 구독 추가'를 클릭하여\n반복 지출을 추적하세요.",
      perWk: '/주',
      perMo: '/월',
      perQtr: '/분기',
      perYr: '/년'
    },
    cycles: {
      weekly: '주간',
      monthly: '월간',
      quarterly: '분기',
      yearly: '연간'
    },
    subCategories: {
      Entertainment: '엔터테인먼트',
      Software: '소프트웨어',
      Music: '음악',
      'News & Media': '뉴스 & 미디어',
      'Food & Dining': '식비',
      'Fitness & Health': '피트니스 & 건강',
      Education: '교육',
      'Cloud Storage': '클라우드 저장소',
      Shopping: '쇼핑',
      Other: '기타'
    },
    goals: {
      title: '저축 목표',
      addBtn: '+ 목표 추가',
      goalNameLabel: '목표 이름',
      goalNamePlaceholder: '예: 비상금',
      targetAmountLabel: '목표 금액 ($)',
      currentSavingsLabel: '현재 저축액 ($)',
      targetDateLabel: '목표 날짜 (선택사항)',
      colorLabel: '색상',
      addModal: '새 저축 목표',
      editModal: '목표 수정',
      submitAdd: '목표 추가',
      submitEdit: '목표 업데이트',
      addContributionBtn: '+ 저축 추가',
      contributionModal: '저축 추가',
      contributionAmountLabel: '저축 금액 ($)',
      submitContribution: '저축 추가',
      byLabel: '목표일',
      ofGoal: '/ ${n} 목표',
      remaining: '· ${n} 남음',
      pctComplete: '{pct}% 완료',
      left: '${n} 남음',
      done: '✓ 완료',
      noGoals: "'+ 목표 추가'를 클릭하여\n첫 번째 저축 목표를 설정하세요."
    },
    csv: {
      title: 'CSV에서 가져오기',
      step1: '1단계 (총 2단계) — 은행 내역 파일을 업로드하고 열을 매핑하세요',
      step2: '2단계 (총 2단계) — 가져오기 전 거래 내역을 검토하세요',
      clickToSelect: '은행 CSV 파일을 클릭하여 선택하세요',
      bankHint: 'CBA · ANZ · NAB · Westpac · Up Bank · 대부분의 호주 은행',
      rowsMeta: '{rows}행 · {cols}열 · 클릭하여 변경',
      amountFormat: '금액 형식',
      singleAmount: '단일 금액 열',
      separateDebitCredit: '분리된 출금/입금 열 (Westpac)',
      dateColumn: '날짜 열',
      descriptionColumn: '설명 열',
      amountColumn: '금액 열',
      negativeHint: '— 음수 값은 지출로 처리됩니다',
      debitColumn: '출금 열',
      debitHint: '— 지출',
      creditColumn: '입금 열',
      creditSkipped: '수입은 가져오지 않음',
      previewBtn: '미리보기 →',
      backBtn: '← 뒤로',
      importing: '가져오는 중…',
      importBtn: '지출 {n}개 가져오기',
      selectAll: '전체 선택',
      none: '전체 해제',
      selectedOf: '{n}/{m} 거래 선택됨',
      noTransactions: '현재 매핑으로 지출 거래를 찾을 수 없습니다.\n뒤로 가서 열 선택을 확인하세요.',
      dupNotice: '중복 {n}개 발견 및 선택 해제됨 — 이미 존재하는 지출과 일치합니다',
      dupBadge: '중복',
      headerlessNotice: '열 헤더가 감지되지 않았습니다 — 위치 기반으로 열이 매핑됩니다 (CommBank 형식). 필요시 아래에서 조정하세요.',
      selectPrompt: '— 선택 —'
    }
  }
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en')

  function setLanguage(l) {
    setLang(l)
    localStorage.setItem('lang', l)
  }

  function t(key, vars = {}) {
    const keys = key.split('.')
    let val = translations[lang]
    for (const k of keys) {
      if (val == null) break
      val = val[k]
    }
    if (val == null) return key
    return String(val).replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : `{${k}}`)
  }

  const locale = lang === 'ko' ? 'ko-KR' : 'en-AU'

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t, locale }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  return useContext(LanguageContext)
}
