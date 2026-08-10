/** Static loader registry: every exercise remains a separately analyzable Vite chunk. */
import type { App } from 'vue';
import { createGameComponent } from '../../../asyncGameComponent';

const BrainTrainingHub = createGameComponent(() => import('./BrainTrainingHub.vue'));
const BrainTrainingNotes = createGameComponent(() => import('./shared/BrainTrainingNotes.vue'));
const SchulteTraining = createGameComponent(() => import('./exercises/schulte/SchulteTraining.vue'));
const FlankerTraining = createGameComponent(() => import('./exercises/flanker/FlankerTraining.vue'));
const NBackTraining = createGameComponent(() => import('./exercises/n-back/NBackTraining.vue'));
const TaskSwitchingTraining = createGameComponent(() => import('./exercises/task-switching/TaskSwitchingTraining.vue'));

export function registerBrainTrainingComponents(app: App): void {
  app.component('BrainTrainingHub', BrainTrainingHub);
  app.component('BrainTrainingNotes', BrainTrainingNotes);
  app.component('SchulteTraining', SchulteTraining);
  app.component('FlankerTraining', FlankerTraining);
  app.component('NBackTraining', NBackTraining);
  app.component('TaskSwitchingTraining', TaskSwitchingTraining);
}
