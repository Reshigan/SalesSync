import express from 'express';
import { prisma } from '../database';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all surveys
router.get('/', async (req, res, next) => {
  try {
    const { status, type, campaignId, startDate, endDate } = req.query;
    
    const where: any = {
      tenantId: req.tenantId
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (campaignId) where.campaignId = campaignId;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate as string);
      if (endDate) where.startDate.lte = new Date(endDate as string);
    }

    const surveys = await prisma.survey.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        campaign: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true
          }
        },
        _count: {
          select: {
            questions: true,
            responses: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(surveys);
  } catch (error) {
    logger.error('Error fetching surveys:', error);
    next(error);
  }
});

// Get single survey with questions
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const survey = await prisma.survey.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        campaign: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            description: true
          }
        },
        questions: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            responses: true
          }
        }
      }
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    res.json(survey);
  } catch (error) {
    logger.error('Error fetching survey:', error);
    next(error);
  }
});

// Create survey with questions
router.post('/', async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      targetAudience,
      startDate,
      endDate,
      status,
      isAnonymous,
      allowMultiple,
      campaignId,
      questions
    } = req.body;

    // Validation
    if (!title || !type || !targetAudience || !startDate) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['title', 'type', 'targetAudience', 'startDate']
      });
    }

    if (questions && !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Questions must be an array' });
    }

    // Verify campaign belongs to tenant (if provided)
    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: {
          id: campaignId,
          tenantId: req.tenantId
        }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
    }

    const survey = await prisma.survey.create({
      data: {
        title,
        description,
        type,
        targetAudience,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'DRAFT',
        isAnonymous: isAnonymous === true,
        allowMultiple: allowMultiple === true,
        tenantId: req.tenantId!,
        createdById: req.user!.userId,
        campaignId: campaignId || null,
        questions: questions ? {
          create: questions.map((q: any, index: number) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options || null,
            isRequired: q.isRequired === true,
            order: q.order !== undefined ? q.order : index
          }))
        } : undefined
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        campaign: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    logger.info(`Survey created: ${survey.id} by user ${req.user!.userId}`);
    res.status(201).json(survey);
  } catch (error) {
    logger.error('Error creating survey:', error);
    next(error);
  }
});

// Update survey
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      targetAudience,
      startDate,
      endDate,
      status,
      isAnonymous,
      allowMultiple,
      campaignId
    } = req.body;

    // Verify survey belongs to tenant
    const existingSurvey = await prisma.survey.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existingSurvey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Verify campaign belongs to tenant (if provided)
    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: {
          id: campaignId,
          tenantId: req.tenantId
        }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type) updateData.type = type;
    if (targetAudience) updateData.targetAudience = targetAudience;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (status) updateData.status = status;
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous;
    if (allowMultiple !== undefined) updateData.allowMultiple = allowMultiple;
    if (campaignId !== undefined) updateData.campaignId = campaignId;

    const survey = await prisma.survey.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        campaign: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    logger.info(`Survey updated: ${id}`);
    res.json(survey);
  } catch (error) {
    logger.error('Error updating survey:', error);
    next(error);
  }
});

// Delete survey
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingSurvey = await prisma.survey.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existingSurvey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    await prisma.survey.delete({
      where: { id }
    });

    logger.info(`Survey deleted: ${id}`);
    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    logger.error('Error deleting survey:', error);
    next(error);
  }
});

// Add question to survey
router.post('/:id/questions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionText, questionType, options, isRequired, order } = req.body;

    // Validation
    if (!questionText || !questionType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['questionText', 'questionType']
      });
    }

    // Verify survey belongs to tenant
    const survey = await prisma.survey.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Get next order number if not provided
    let questionOrder = order;
    if (questionOrder === undefined) {
      const lastQuestion = await prisma.surveyQuestion.findFirst({
        where: { surveyId: id },
        orderBy: { order: 'desc' }
      });
      questionOrder = lastQuestion ? lastQuestion.order + 1 : 0;
    }

    const question = await prisma.surveyQuestion.create({
      data: {
        surveyId: id,
        questionText,
        questionType,
        options: options || null,
        isRequired: isRequired === true,
        order: questionOrder
      }
    });

    logger.info(`Question added to survey ${id}: ${question.id}`);
    res.status(201).json(question);
  } catch (error) {
    logger.error('Error adding question:', error);
    next(error);
  }
});

// Update question
router.put('/questions/:questionId', async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { questionText, questionType, options, isRequired, order } = req.body;

    // Verify question exists and belongs to tenant
    const existingQuestion = await prisma.surveyQuestion.findFirst({
      where: {
        id: questionId,
        survey: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const updateData: any = {};
    if (questionText) updateData.questionText = questionText;
    if (questionType) updateData.questionType = questionType;
    if (options !== undefined) updateData.options = options;
    if (isRequired !== undefined) updateData.isRequired = isRequired;
    if (order !== undefined) updateData.order = order;

    const question = await prisma.surveyQuestion.update({
      where: { id: questionId },
      data: updateData
    });

    logger.info(`Question updated: ${questionId}`);
    res.json(question);
  } catch (error) {
    logger.error('Error updating question:', error);
    next(error);
  }
});

// Delete question
router.delete('/questions/:questionId', async (req, res, next) => {
  try {
    const { questionId } = req.params;

    // Verify question exists and belongs to tenant
    const existingQuestion = await prisma.surveyQuestion.findFirst({
      where: {
        id: questionId,
        survey: {
          tenantId: req.tenantId
        }
      }
    });

    if (!existingQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await prisma.surveyQuestion.delete({
      where: { id: questionId }
    });

    logger.info(`Question deleted: ${questionId}`);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    logger.error('Error deleting question:', error);
    next(error);
  }
});

// Submit survey response
router.post('/:id/submit', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers, location, deviceInfo } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    // Verify survey exists and is active
    const survey = await prisma.survey.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
        status: 'ACTIVE'
      },
      include: {
        questions: true
      }
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or not active' });
    }

    // Check if user can submit multiple responses
    if (!survey.allowMultiple && req.user) {
      const existingResponse = await prisma.surveyResponse.findFirst({
        where: {
          surveyId: id,
          respondentId: req.user.userId
        }
      });

      if (existingResponse) {
        return res.status(400).json({ error: 'You have already submitted this survey' });
      }
    }

    // Validate required questions
    const requiredQuestions = survey.questions.filter(q => q.isRequired);
    const answeredQuestionIds = answers.map((a: any) => a.questionId);
    const missingRequired = requiredQuestions.filter(q => !answeredQuestionIds.includes(q.id));

    if (missingRequired.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required questions',
        missingQuestions: missingRequired.map(q => ({ id: q.id, text: q.questionText }))
      });
    }

    // Create response with answers
    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: id,
        respondentId: survey.isAnonymous ? null : (req.user?.userId || null),
        location,
        deviceInfo: deviceInfo || null,
        answers: {
          create: answers.map((answer: any) => ({
            questionId: answer.questionId,
            answerText: answer.answerText || null,
            answerValue: answer.answerValue || null
          }))
        }
      },
      include: {
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    logger.info(`Survey response submitted: ${response.id} for survey ${id}`);
    res.status(201).json(response);
  } catch (error) {
    logger.error('Error submitting survey response:', error);
    next(error);
  }
});

// Get survey responses
router.get('/:id/responses', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify survey belongs to tenant
    const survey = await prisma.survey.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId: id },
      include: {
        respondent: survey.isAnonymous ? false : {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                options: true
              }
            }
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json(responses);
  } catch (error) {
    logger.error('Error fetching survey responses:', error);
    next(error);
  }
});

// Get survey analytics
router.get('/:id/analytics', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify survey belongs to tenant
    const survey = await prisma.survey.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId: id },
      include: {
        answers: true
      }
    });

    const analytics = {
      surveyInfo: {
        id: survey.id,
        title: survey.title,
        type: survey.type,
        status: survey.status,
        startDate: survey.startDate,
        endDate: survey.endDate
      },
      totalResponses: responses.length,
      completionRate: survey.questions.length > 0 
        ? (responses.filter(r => r.answers.length === survey.questions.length).length / responses.length * 100)
        : 0,
      questions: survey.questions.map(question => {
        const questionAnswers = responses.flatMap(r => 
          r.answers.filter(a => a.questionId === question.id)
        );

        const analytics: any = {
          id: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          totalAnswers: questionAnswers.length,
          responseRate: responses.length > 0 ? (questionAnswers.length / responses.length * 100) : 0
        };

        // Add question-type specific analytics
        if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'SINGLE_CHOICE') {
          const options = question.options as string[] || [];
          analytics.optionBreakdown = options.map(option => ({
            option,
            count: questionAnswers.filter(a => a.answerText === option).length
          }));
        } else if (question.questionType === 'RATING' || question.questionType === 'SCALE') {
          const ratings = questionAnswers.map(a => parseFloat(a.answerText || '0')).filter(r => !isNaN(r));
          analytics.averageRating = ratings.length > 0 
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
            : 0;
          analytics.minRating = ratings.length > 0 ? Math.min(...ratings) : 0;
          analytics.maxRating = ratings.length > 0 ? Math.max(...ratings) : 0;
        } else if (question.questionType === 'YES_NO') {
          analytics.yesCount = questionAnswers.filter(a => a.answerText?.toLowerCase() === 'yes').length;
          analytics.noCount = questionAnswers.filter(a => a.answerText?.toLowerCase() === 'no').length;
        }

        return analytics;
      })
    };

    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching survey analytics:', error);
    next(error);
  }
});

// Get overall survey statistics
router.get('/stats/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      tenantId: req.tenantId
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const surveys = await prisma.survey.findMany({
      where,
      include: {
        _count: {
          select: {
            responses: true,
            questions: true
          }
        }
      }
    });

    const totalResponses = await prisma.surveyResponse.count({
      where: {
        survey: {
          tenantId: req.tenantId,
          ...(startDate || endDate ? {
            createdAt: where.createdAt
          } : {})
        }
      }
    });

    const stats = {
      totalSurveys: surveys.length,
      totalResponses,
      averageResponsesPerSurvey: surveys.length > 0 ? totalResponses / surveys.length : 0,
      statusBreakdown: {
        draft: surveys.filter(s => s.status === 'DRAFT').length,
        active: surveys.filter(s => s.status === 'ACTIVE').length,
        paused: surveys.filter(s => s.status === 'PAUSED').length,
        completed: surveys.filter(s => s.status === 'COMPLETED').length,
        archived: surveys.filter(s => s.status === 'ARCHIVED').length
      },
      typeBreakdown: {
        customerSatisfaction: surveys.filter(s => s.type === 'CUSTOMER_SATISFACTION').length,
        marketResearch: surveys.filter(s => s.type === 'MARKET_RESEARCH').length,
        productFeedback: surveys.filter(s => s.type === 'PRODUCT_FEEDBACK').length,
        brandAwareness: surveys.filter(s => s.type === 'BRAND_AWARENESS').length,
        competitorAnalysis: surveys.filter(s => s.type === 'COMPETITOR_ANALYSIS').length,
        mysteryShopping: surveys.filter(s => s.type === 'MYSTERY_SHOPPING').length,
        custom: surveys.filter(s => s.type === 'CUSTOM').length
      }
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching survey statistics:', error);
    next(error);
  }
});

export default router;
