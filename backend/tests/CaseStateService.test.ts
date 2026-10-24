import { CaseStateService, ConsoleNotificationService } from '../src/services/CaseStateService';

// Mock Prisma
jest.mock('../src/prisma', () => ({
  __esModule: true,
  default: {
    case: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    property: {
      findUnique: jest.fn(),
    },
    checklistTemplate: {
      findUnique: jest.fn(),
    },
    statusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import prisma from '../src/prisma';

describe('CaseStateService', () => {
  let service: CaseStateService;
  
  beforeEach(() => {
    service = new CaseStateService(new ConsoleNotificationService());
    jest.clearAllMocks();
  });

  it('allows valid transition INTAKE to DOCUMENT_COLLECTION', async () => {
    (prisma.case.findUnique as jest.Mock).mockResolvedValue({
      id: 'case-1',
      status: 'INTAKE',
      documents: [],
    });
    
    await expect(service.changeStatus('case-1', 'DOCUMENT_COLLECTION', 'user-1')).resolves.not.toThrow();
  });

  it('rejects invalid transition INTAKE to SUBMITTED', async () => {
    (prisma.case.findUnique as jest.Mock).mockResolvedValue({
      id: 'case-1',
      status: 'INTAKE',
      documents: [],
    });
    
    await expect(service.changeStatus('case-1', 'SUBMITTED', 'user-1')).rejects.toThrow('Invalid status transition');
  });

  it('rejects SUBMITTED without application_number', async () => {
    (prisma.case.findUnique as jest.Mock).mockResolvedValue({
      id: 'case-1',
      status: 'APPLICATION_PREP',
      application_number: null,
      documents: [],
    });
    
    await expect(service.changeStatus('case-1', 'SUBMITTED', 'user-1')).rejects.toThrow('application_number is missing');
  });

  it('allows SUBMITTED with application_number', async () => {
    (prisma.case.findUnique as jest.Mock).mockResolvedValue({
      id: 'case-1',
      status: 'APPLICATION_PREP',
      application_number: 'APP123',
      documents: [],
    });
    
    await expect(service.changeStatus('case-1', 'SUBMITTED', 'user-1')).resolves.not.toThrow();
  });
});
