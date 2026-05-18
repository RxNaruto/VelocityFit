import { Router } from 'express';
import * as ctrl from '../controllers/catalogController.js';

const router = Router();

router.get('/muscle-groups', ctrl.getMuscleGroups);
router.post('/muscle-groups', ctrl.createMuscleGroup);

router.get('/exercises', ctrl.getExercises);
router.post('/exercises', ctrl.createExercise);
router.put('/exercises/:id', ctrl.updateExercise);
router.delete('/exercises/:id', ctrl.deleteExercise);

export default router;