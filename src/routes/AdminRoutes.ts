
import {  authenticateUser } from "../middlewares/authenticateUser";
import { Router } from "express";
import * as teamController from '../controllers/teams';
import * as roundsController from '../controllers/rounds';
import * as questionsController from '../controllers/questions'
import * as testCaseController from '../controllers/testcases'
import * as buggyCodeController from '../controllers/buggycodes'
import * as adminSubmissionsController from '../controllers/admin/submissions/index'
import * as adminSubmissionsShow from '../controllers/admin/submissions/show'
import { upload } from "../middlewares/upload.middleware";
const router = Router();

// teams crud
router.post('/teams', authenticateUser('ADMIN'), teamController.createTeam);       // Create team
router.get('/teams/download' , authenticateUser('ADMIN') , teamController.downloadTeams )
router.get('/teams/:id', authenticateUser('ADMIN'), teamController.getTeamById);  // Get single team
router.put('/teams/:id', authenticateUser('ADMIN'), teamController.updateTeam);   // Update team
router.delete('/teams/:id', authenticateUser('ADMIN'), teamController.deleteTeam);// Delete team
router.get('/teams', authenticateUser('ADMIN'), teamController.getAllTeams);       // List all teams

// Admin submissions

router.get('/rounds/:roundId/submissions', authenticateUser('ADMIN'), adminSubmissionsController.index)
router.get('/submissions/:id', authenticateUser('ADMIN'), adminSubmissionsShow.show)
// CSV Upload
router.post(
  '/teams/upload',
  authenticateUser('ADMIN'),
  upload.single('file'),   
  teamController.uploadTeams
);



// rounds management crud

router.post('/rounds',authenticateUser('ADMIN'), roundsController.createRound);
router.put('/rounds/:id/unlock',authenticateUser('ADMIN'), roundsController.unlockRound);
router.put('/rounds/:id/lock',authenticateUser('ADMIN'), roundsController.lockRound);
router.put('/rounds/:id/start',authenticateUser('ADMIN'), roundsController.startRound);
router.put('/rounds/:id/stop',authenticateUser('ADMIN'), roundsController.stopRound);
router.put('/rounds/:id/complete',authenticateUser('ADMIN'), roundsController.completeRound);
router.delete('/rounds/:id',authenticateUser('ADMIN'), roundsController.deleteRound);

// questions management crud
router.post('/:roundId/questions',authenticateUser('ADMIN'), questionsController.createQuestion);
router.put('/:roundId/questions',authenticateUser('ADMIN'), questionsController.updateQuestion);
router.delete('/questions/:id',authenticateUser('ADMIN'), questionsController.deleteQuestion);
router.get('/:roundId/questions',authenticateUser(), questionsController.getQuestions);

// TestCases
router.post('/:questionId/testcases',authenticateUser('ADMIN'), testCaseController.createTestCase);
router.put('/testcases/:id',authenticateUser('ADMIN'), testCaseController.updateTestCase);
router.delete('/testcases/:id',authenticateUser('ADMIN'), testCaseController.deleteTestCase);

// BuggyCodes
router.post('/:questionId/buggycodes',authenticateUser('ADMIN'), buggyCodeController.createBuggyCode);
router.put('/buggycodes/:id',authenticateUser('ADMIN'), buggyCodeController.updateBuggyCode);
router.delete('/buggycodes/:id',authenticateUser('ADMIN'), buggyCodeController.deleteBuggyCode);

export default router