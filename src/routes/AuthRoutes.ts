import {Router , Request , Response} from 'express';
import { loginController } from '../controllers/loginController';
import {  authenticateUser } from '../middlewares/authenticateUser';
import * as roundsController from '../controllers/rounds';
import { getQuestionById } from '../controllers/questions/getQuestionByID';
import {getRoundDetailsById} from '../controllers/rounds/getRoundById'
import * as questionsController from '../controllers/questions'
import { submitQuestion } from '../controllers/submissions/submitQuestion'
import * as leaderboardController from '../controllers/leaderboardController'
import { registerController } from '../controllers/auth/registerController'
import { meController } from '../controllers/auth/meController'

const router = Router();

router.post('/login', loginController);
router.post('/register', registerController);
router.get('/me', authenticateUser(), meController);

router.post('/rounds/:roundId/questions/:questionId/submit', authenticateUser(), submitQuestion)
router.get('/rounds/:roundId/questions', authenticateUser(), questionsController.getQuestions)
router.get('/rounds/:roundId' , authenticateUser(), getRoundDetailsById)
router.get('/rounds',authenticateUser(), roundsController.getAllRounds);
router.get('/question/:id' , authenticateUser(), getQuestionById)

// Leaderboard endpoints
router.get('/rounds/:roundId/leaderboard', authenticateUser(), leaderboardController.roundLeaderboard);
router.get('/competitions/:competitionId/leaderboard', authenticateUser(), leaderboardController.competitionLeaderboard);

// Users
import * as usersController from '../controllers/users/show'
router.get('/users/:id', authenticateUser(), usersController.show);


export default router;