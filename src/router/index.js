import Vue from 'vue'
import Router from 'vue-router'
import Piano from '@/components/Piano'
import StepFirst from '@/components/StepFirst'
import StepSecond from '@/components/StepSecond'
import StepThird from '@/components/StepThird'
import StepForth from '@/components/StepForth'
import StepFifth from '@/components/StepFifth'
import StepSixth from '@/components/StepSixth'
import StepSeven from '@/components/StepSeven'
import StepEight from '@/components/StepEight'
import StepNine from '@/components/StepNine'
import StepTen from '@/components/StepTen'
Vue.use(Router)

export default new Router({
  mode: "history",
  routes: [
    {
      path: '/',
      redirect: '/piano',
    },
    {
      path: '/piano',
      component: Piano,
    },
    {
      path: '/step1',
      component: StepFirst,
    },
    {
      path: '/step2',
      component: StepSecond,
    },
    {
      path: '/step3',
      component: StepThird,
    }, {
      path: '/step4',
      component: StepForth
    }, {
      path: '/step5',
      component: StepFifth
    }, {
      path: '/step6',
      component: StepSixth
    },
    {
      path: '/step7',
      component: StepSeven
    },
    {
      path: '/step8',
      component: StepEight
    },
    {
      path: '/step9',
      component: StepNine
    },
    {
      path: '/step10',
      component: StepTen
    },
  ]
})
