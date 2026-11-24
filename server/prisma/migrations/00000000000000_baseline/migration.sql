-- CreateEnum
CREATE TYPE "FeeModel" AS ENUM ('FIXED_FEE_PHASE_CAP', 'HOURLY_CAPPED', 'PERCENTAGE_CONSTRUCTION_COST', 'RETAINER_PASS_THROUGH');

-- CreateEnum
CREATE TYPE "ProjectPhaseType" AS ENUM ('SD', 'DD', 'CD', 'CA');

-- CreateEnum
CREATE TYPE "RfiStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RESPONDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SubmittalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'APPROVED_AS_NOTED', 'REVISE_RESUBMIT', 'REJECTED');

-- CreateTable
CREATE TABLE "aec_drawing_sheets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sheetNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "currentRevision" TEXT NOT NULL,
    "issueStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aec_drawing_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aec_project_phases" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phaseType" "ProjectPhaseType" NOT NULL,
    "feeModel" "FeeModel" NOT NULL DEFAULT 'FIXED_FEE_PHASE_CAP',
    "allocatedFee" DECIMAL(12,2) NOT NULL,
    "spentFee" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "signOffDate" TIMESTAMP(3),
    "signOffBy" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aec_project_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aec_rfis" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rfiNumber" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "disciplineTag" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT,
    "impactCost" BOOLEAN NOT NULL DEFAULT false,
    "impactSchedule" BOOLEAN NOT NULL DEFAULT false,
    "status" "RfiStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "aec_rfis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aec_sheet_versions" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "fileUrl" TEXT,
    "markupUrl" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "aec_sheet_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aec_site_reports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reportNumber" INTEGER NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weather" TEXT,
    "attendees" JSONB,
    "observations" TEXT NOT NULL,
    "punchList" JSONB,
    "photos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aec_site_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aec_sub_consultant_ledgers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "consultantName" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "allocatedBudget" DECIMAL(12,2) NOT NULL,
    "invoicedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "contractStatus" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aec_sub_consultant_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aec_submittals" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "submittalNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "specSection" TEXT NOT NULL,
    "status" "SubmittalStatus" NOT NULL DEFAULT 'SUBMITTED',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnedDate" TIMESTAMP(3),

    CONSTRAINT "aec_submittals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_types" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "locationType" TEXT NOT NULL DEFAULT 'google_meet',
    "locationUrl" TEXT,
    "bufferBeforeMin" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMin" INTEGER NOT NULL DEFAULT 10,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customQuestions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookingTypeId" TEXT,
    "hostUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "locationType" TEXT NOT NULL DEFAULT 'google_meet',
    "locationUrl" TEXT,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "guestNotes" TEXT,
    "customAnswers" JSONB,
    "projectId" TEXT,
    "accountId" TEXT,
    "contactId" TEXT,
    "dealId" TEXT,
    "cancellationReason" TEXT,
    "rescheduledFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_price_books" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricingRules" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_price_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_products_services" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'product',
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inventoryQty" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "billingFrequency" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_products_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_accounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "domain" TEXT,
    "primaryPhone" TEXT,
    "secondaryPhone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "industry" TEXT NOT NULL DEFAULT 'Other',
    "accountType" TEXT NOT NULL DEFAULT 'prospect',
    "rating" TEXT NOT NULL DEFAULT 'warm',
    "annualRevenue" DOUBLE PRECISION,
    "billingStreet" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingPostalCode" TEXT,
    "billingCountry" TEXT,
    "shippingStreet" TEXT,
    "shippingCity" TEXT,
    "shippingState" TEXT,
    "shippingPostalCode" TEXT,
    "shippingCountry" TEXT,
    "description" TEXT,
    "assignedUserId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contacts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "salutation" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "secondaryEmail" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "reportsToContactId" TEXT,
    "mailingStreet" TEXT,
    "mailingCity" TEXT,
    "mailingState" TEXT,
    "mailingPostalCode" TEXT,
    "mailingCountry" TEXT,
    "isPrimaryContact" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "assignedUserId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_deals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dealNumber" TEXT NOT NULL,
    "dealName" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "contactId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "closingDate" TIMESTAMP(3) NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'prospecting',
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dealType" TEXT NOT NULL DEFAULT 'new_business',
    "leadSource" TEXT,
    "linkedProjectId" TEXT,
    "lostReason" TEXT,
    "description" TEXT,
    "assignedUserId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_entity_activity_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "fieldChanges" JSONB,
    "description" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_entity_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadNumber" TEXT NOT NULL,
    "salutation" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT NOT NULL,
    "secondaryEmail" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "website" TEXT,
    "leadSource" TEXT NOT NULL DEFAULT 'web_site',
    "leadStatus" TEXT NOT NULL DEFAULT 'unqualified',
    "rating" TEXT,
    "industry" TEXT,
    "annualRevenue" DOUBLE PRECISION,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "description" TEXT,
    "assignedUserId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,
    "convertedAccountId" TEXT,
    "convertedContactId" TEXT,
    "convertedDealId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_deliverables" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'service',
    "lineItemId" TEXT,
    "productId" TEXT,
    "sku" TEXT,
    "milestoneId" TEXT,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitMarginAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitMarginPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "fulfilledDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_expense_entries" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'labor',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incurredDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_expense_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_line_items" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'product',
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "financial_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_project_budgets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "capexBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "opexBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "laborBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualLaborCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "profitMarginPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_project_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_quotes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dealId" TEXT,
    "accountId" TEXT,
    "contactId" TEXT,
    "projectId" TEXT,
    "priceBookId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marginAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marginPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_client_change_requests" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "costImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scheduleDaysImpact" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "clientNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_client_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_project_documents" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileCategory" TEXT NOT NULL DEFAULT 'general',
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_project_invoices" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lineItems" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_project_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_project_wiki_pages" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentMarkdown" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_project_wiki_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_timesheets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billableHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approverId" TEXT,
    "rejectionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppm_portfolios" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "strategicGoal" TEXT NOT NULL,
    "budgetAllocated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetROI" DOUBLE PRECISION,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppm_portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppm_resource_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "skills" JSONB NOT NULL,
    "weeklyCapacityHours" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "hourlyCostRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hourlyBillingRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "globalWorkloadHours" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppm_resource_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppm_risk_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'operational',
    "probability" INTEGER NOT NULL DEFAULT 1,
    "impact" INTEGER NOT NULL DEFAULT 1,
    "riskScore" INTEGER NOT NULL DEFAULT 1,
    "mitigationPlan" TEXT,
    "departmentDependencies" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppm_risk_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "modulePermissions" JSONB NOT NULL,
    "fieldPermissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT,
    "ownerId" TEXT NOT NULL,
    "members" JSONB,
    "accountId" TEXT,
    "dealId" TEXT,
    "primaryContactId" TEXT,
    "portfolioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT,
    "estimatedCost" DECIMAL(14,2),
    "targetMultiplier" DECIMAL(4,2) NOT NULL DEFAULT 3.0,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentRoleId" TEXT,
    "assignedProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_custom_fields" (
    "id" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,
    "blockId" TEXT,
    "fieldId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "picklistValues" JSONB,
    "defaultValue" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "settings_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_email_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'smtp',
    "fromEmail" TEXT,
    "senderEmail" TEXT,
    "fromName" TEXT,
    "senderName" TEXT,
    "apiKey" TEXT,
    "domain" TEXT,
    "smtpSettings" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "settings_email_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_email_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT,
    "targetModule" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "htmlBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "settings_email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_layout_blocks" (
    "id" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCollapsible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "settings_layout_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_module_schemas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_module_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_system_config" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyDetails" JSONB NOT NULL,
    "activeModules" JSONB NOT NULL,
    "autoNumbering" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "settings_system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_workflow_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetModule" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "graphData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_workflow_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_interactions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT,
    "platform" TEXT NOT NULL,
    "externalId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "mediaUrls" JSONB,
    "sentiment" TEXT NOT NULL DEFAULT 'neutral',
    "sentimentScore" DOUBLE PRECISION DEFAULT 0.0,
    "intent" TEXT NOT NULL DEFAULT 'general',
    "urgency" TEXT NOT NULL DEFAULT 'low',
    "status" TEXT NOT NULL DEFAULT 'new',
    "threadHistory" JSONB,
    "escalatedTaskId" TEXT,
    "linkedContactId" TEXT,
    "linkedAccountId" TEXT,
    "linkedDealId" TEXT,
    "postUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_listening_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" JSONB NOT NULL,
    "excludedWords" JSONB,
    "platforms" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_listening_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtasks" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT DEFAULT 'medium',
    "attachments" JSONB,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_audit_trail" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "description" TEXT,
    "previousState" JSONB,
    "newState" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_audit_trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "assignedAgent" TEXT,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assigneeId" TEXT,
    "creatorId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "parentTaskId" TEXT,
    "milestoneId" TEXT,
    "lineItemId" TEXT,
    "estimatedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "predecessorTaskIds" JSONB,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "customFields" JSONB,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "discipline" TEXT,
    "requiredRole" TEXT,
    "prerequisiteTaskId" TEXT,
    "isGatekeeper" BOOLEAN NOT NULL DEFAULT false,
    "phaseId" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "industry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_logs" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "hoursLogged" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "hourlyRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "timesheetId" TEXT,
    "phaseId" TEXT,
    "phaseBillingCode" TEXT,

    CONSTRAINT "time_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_availabilities" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "weeklySchedule" JSONB NOT NULL,
    "slotStepMin" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "photoURL" TEXT,
    "role" TEXT NOT NULL DEFAULT 'developer',
    "isTenantAdmin" BOOLEAN NOT NULL DEFAULT false,
    "profileId" TEXT,
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aec_drawing_sheets_projectId_idx" ON "aec_drawing_sheets"("projectId" ASC);

-- CreateIndex
CREATE INDEX "aec_drawing_sheets_tenantId_idx" ON "aec_drawing_sheets"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "aec_project_phases_projectId_idx" ON "aec_project_phases"("projectId" ASC);

-- CreateIndex
CREATE INDEX "aec_project_phases_tenantId_idx" ON "aec_project_phases"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "aec_rfis_projectId_idx" ON "aec_rfis"("projectId" ASC);

-- CreateIndex
CREATE INDEX "aec_rfis_tenantId_idx" ON "aec_rfis"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "aec_sheet_versions_sheetId_idx" ON "aec_sheet_versions"("sheetId" ASC);

-- CreateIndex
CREATE INDEX "aec_site_reports_projectId_idx" ON "aec_site_reports"("projectId" ASC);

-- CreateIndex
CREATE INDEX "aec_site_reports_tenantId_idx" ON "aec_site_reports"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "aec_sub_consultant_ledgers_projectId_idx" ON "aec_sub_consultant_ledgers"("projectId" ASC);

-- CreateIndex
CREATE INDEX "aec_sub_consultant_ledgers_tenantId_idx" ON "aec_sub_consultant_ledgers"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "aec_submittals_projectId_idx" ON "aec_submittals"("projectId" ASC);

-- CreateIndex
CREATE INDEX "aec_submittals_tenantId_idx" ON "aec_submittals"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "booking_types_tenantId_idx" ON "booking_types"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "booking_types_tenantId_userId_slug_key" ON "booking_types"("tenantId" ASC, "userId" ASC, "slug" ASC);

-- CreateIndex
CREATE INDEX "booking_types_userId_idx" ON "booking_types"("userId" ASC);

-- CreateIndex
CREATE INDEX "bookings_accountId_idx" ON "bookings"("accountId" ASC);

-- CreateIndex
CREATE INDEX "bookings_contactId_idx" ON "bookings"("contactId" ASC);

-- CreateIndex
CREATE INDEX "bookings_guestEmail_idx" ON "bookings"("guestEmail" ASC);

-- CreateIndex
CREATE INDEX "bookings_hostUserId_idx" ON "bookings"("hostUserId" ASC);

-- CreateIndex
CREATE INDEX "bookings_projectId_idx" ON "bookings"("projectId" ASC);

-- CreateIndex
CREATE INDEX "bookings_startTime_idx" ON "bookings"("startTime" ASC);

-- CreateIndex
CREATE INDEX "bookings_tenantId_idx" ON "bookings"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "bookings_tenantId_startTime_idx" ON "bookings"("tenantId" ASC, "startTime" ASC);

-- CreateIndex
CREATE INDEX "bookings_tenantId_status_idx" ON "bookings"("tenantId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "catalog_price_books_tenantId_idx" ON "catalog_price_books"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "catalog_products_services_sku_idx" ON "catalog_products_services"("sku" ASC);

-- CreateIndex
CREATE INDEX "catalog_products_services_tenantId_idx" ON "catalog_products_services"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "crm_accounts_assignedUserId_idx" ON "crm_accounts"("assignedUserId" ASC);

-- CreateIndex
CREATE INDEX "crm_accounts_tenantId_idx" ON "crm_accounts"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "crm_contacts_accountId_idx" ON "crm_contacts"("accountId" ASC);

-- CreateIndex
CREATE INDEX "crm_contacts_assignedUserId_idx" ON "crm_contacts"("assignedUserId" ASC);

-- CreateIndex
CREATE INDEX "crm_contacts_email_idx" ON "crm_contacts"("email" ASC);

-- CreateIndex
CREATE INDEX "crm_contacts_tenantId_idx" ON "crm_contacts"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "crm_deals_accountId_idx" ON "crm_deals"("accountId" ASC);

-- CreateIndex
CREATE INDEX "crm_deals_assignedUserId_idx" ON "crm_deals"("assignedUserId" ASC);

-- CreateIndex
CREATE INDEX "crm_deals_contactId_idx" ON "crm_deals"("contactId" ASC);

-- CreateIndex
CREATE INDEX "crm_deals_tenantId_createdAt_idx" ON "crm_deals"("tenantId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "crm_deals_tenantId_idx" ON "crm_deals"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "crm_deals_tenantId_stage_idx" ON "crm_deals"("tenantId" ASC, "stage" ASC);

-- CreateIndex
CREATE INDEX "crm_entity_activity_logs_moduleName_entityId_idx" ON "crm_entity_activity_logs"("moduleName" ASC, "entityId" ASC);

-- CreateIndex
CREATE INDEX "crm_entity_activity_logs_tenantId_idx" ON "crm_entity_activity_logs"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "crm_entity_activity_logs_tenantId_moduleName_entityId_idx" ON "crm_entity_activity_logs"("tenantId" ASC, "moduleName" ASC, "entityId" ASC);

-- CreateIndex
CREATE INDEX "crm_entity_activity_logs_tenantId_timestamp_idx" ON "crm_entity_activity_logs"("tenantId" ASC, "timestamp" ASC);

-- CreateIndex
CREATE INDEX "crm_leads_assignedUserId_idx" ON "crm_leads"("assignedUserId" ASC);

-- CreateIndex
CREATE INDEX "crm_leads_email_idx" ON "crm_leads"("email" ASC);

-- CreateIndex
CREATE INDEX "crm_leads_tenantId_idx" ON "crm_leads"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "financial_deliverables_projectId_idx" ON "financial_deliverables"("projectId" ASC);

-- CreateIndex
CREATE INDEX "financial_deliverables_tenantId_idx" ON "financial_deliverables"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "financial_expense_entries_projectId_idx" ON "financial_expense_entries"("projectId" ASC);

-- CreateIndex
CREATE INDEX "financial_expense_entries_tenantId_idx" ON "financial_expense_entries"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "financial_line_items_productId_idx" ON "financial_line_items"("productId" ASC);

-- CreateIndex
CREATE INDEX "financial_line_items_quoteId_idx" ON "financial_line_items"("quoteId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "financial_project_budgets_projectId_key" ON "financial_project_budgets"("projectId" ASC);

-- CreateIndex
CREATE INDEX "financial_project_budgets_tenantId_idx" ON "financial_project_budgets"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "financial_quotes_quoteNumber_idx" ON "financial_quotes"("quoteNumber" ASC);

-- CreateIndex
CREATE INDEX "financial_quotes_tenantId_idx" ON "financial_quotes"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "pm_client_change_requests_projectId_idx" ON "pm_client_change_requests"("projectId" ASC);

-- CreateIndex
CREATE INDEX "pm_client_change_requests_tenantId_idx" ON "pm_client_change_requests"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "pm_project_documents_projectId_idx" ON "pm_project_documents"("projectId" ASC);

-- CreateIndex
CREATE INDEX "pm_project_documents_tenantId_idx" ON "pm_project_documents"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "pm_project_invoices_projectId_idx" ON "pm_project_invoices"("projectId" ASC);

-- CreateIndex
CREATE INDEX "pm_project_invoices_tenantId_idx" ON "pm_project_invoices"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "pm_project_wiki_pages_projectId_idx" ON "pm_project_wiki_pages"("projectId" ASC);

-- CreateIndex
CREATE INDEX "pm_project_wiki_pages_tenantId_idx" ON "pm_project_wiki_pages"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "pm_timesheets_tenantId_idx" ON "pm_timesheets"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "pm_timesheets_userId_idx" ON "pm_timesheets"("userId" ASC);

-- CreateIndex
CREATE INDEX "ppm_portfolios_ownerId_idx" ON "ppm_portfolios"("ownerId" ASC);

-- CreateIndex
CREATE INDEX "ppm_portfolios_tenantId_idx" ON "ppm_portfolios"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "ppm_resource_profiles_tenantId_idx" ON "ppm_resource_profiles"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ppm_resource_profiles_userId_key" ON "ppm_resource_profiles"("userId" ASC);

-- CreateIndex
CREATE INDEX "ppm_risk_items_ownerId_idx" ON "ppm_risk_items"("ownerId" ASC);

-- CreateIndex
CREATE INDEX "ppm_risk_items_projectId_idx" ON "ppm_risk_items"("projectId" ASC);

-- CreateIndex
CREATE INDEX "ppm_risk_items_tenantId_idx" ON "ppm_risk_items"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "profiles_tenantId_idx" ON "profiles"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "project_milestones_projectId_idx" ON "project_milestones"("projectId" ASC);

-- CreateIndex
CREATE INDEX "project_milestones_tenantId_idx" ON "project_milestones"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "projects_accountId_idx" ON "projects"("accountId" ASC);

-- CreateIndex
CREATE INDEX "projects_dealId_idx" ON "projects"("dealId" ASC);

-- CreateIndex
CREATE INDEX "projects_ownerId_idx" ON "projects"("ownerId" ASC);

-- CreateIndex
CREATE INDEX "projects_tenantId_createdAt_idx" ON "projects"("tenantId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "projects_tenantId_idx" ON "projects"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "roles_tenantId_idx" ON "roles"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "settings_custom_fields_blockId_idx" ON "settings_custom_fields"("blockId" ASC);

-- CreateIndex
CREATE INDEX "settings_custom_fields_schemaId_idx" ON "settings_custom_fields"("schemaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "settings_email_configs_tenantId_key" ON "settings_email_configs"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "settings_email_templates_tenantId_idx" ON "settings_email_templates"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "settings_layout_blocks_schemaId_idx" ON "settings_layout_blocks"("schemaId" ASC);

-- CreateIndex
CREATE INDEX "settings_module_schemas_tenantId_idx" ON "settings_module_schemas"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "settings_module_schemas_tenantId_moduleName_key" ON "settings_module_schemas"("tenantId" ASC, "moduleName" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "settings_system_config_tenantId_key" ON "settings_system_config"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "settings_workflow_rules_tenantId_idx" ON "settings_workflow_rules"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "social_interactions_escalatedTaskId_idx" ON "social_interactions"("escalatedTaskId" ASC);

-- CreateIndex
CREATE INDEX "social_interactions_intent_idx" ON "social_interactions"("intent" ASC);

-- CreateIndex
CREATE INDEX "social_interactions_linkedAccountId_idx" ON "social_interactions"("linkedAccountId" ASC);

-- CreateIndex
CREATE INDEX "social_interactions_linkedContactId_idx" ON "social_interactions"("linkedContactId" ASC);

-- CreateIndex
CREATE INDEX "social_interactions_platform_idx" ON "social_interactions"("platform" ASC);

-- CreateIndex
CREATE INDEX "social_interactions_sentiment_idx" ON "social_interactions"("sentiment" ASC);

-- CreateIndex
CREATE INDEX "social_interactions_status_idx" ON "social_interactions"("status" ASC);

-- CreateIndex
CREATE INDEX "social_interactions_tenantId_idx" ON "social_interactions"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "social_interactions_tenantId_publishedAt_idx" ON "social_interactions"("tenantId" ASC, "publishedAt" ASC);

-- CreateIndex
CREATE INDEX "social_interactions_tenantId_status_idx" ON "social_interactions"("tenantId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "social_listening_rules_isActive_idx" ON "social_listening_rules"("isActive" ASC);

-- CreateIndex
CREATE INDEX "social_listening_rules_tenantId_idx" ON "social_listening_rules"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "subtasks_taskId_idx" ON "subtasks"("taskId" ASC);

-- CreateIndex
CREATE INDEX "system_audit_trail_entityType_entityId_idx" ON "system_audit_trail"("entityType" ASC, "entityId" ASC);

-- CreateIndex
CREATE INDEX "system_audit_trail_tenantId_idx" ON "system_audit_trail"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "tasks_assigneeId_idx" ON "tasks"("assigneeId" ASC);

-- CreateIndex
CREATE INDEX "tasks_milestoneId_idx" ON "tasks"("milestoneId" ASC);

-- CreateIndex
CREATE INDEX "tasks_parentTaskId_idx" ON "tasks"("parentTaskId" ASC);

-- CreateIndex
CREATE INDEX "tasks_phaseId_idx" ON "tasks"("phaseId" ASC);

-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "tasks"("projectId" ASC);

-- CreateIndex
CREATE INDEX "tasks_tenantId_createdAt_idx" ON "tasks"("tenantId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "tasks_tenantId_idx" ON "tasks"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "tasks_tenantId_status_idx" ON "tasks"("tenantId" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain" ASC);

-- CreateIndex
CREATE INDEX "time_logs_phaseId_idx" ON "time_logs"("phaseId" ASC);

-- CreateIndex
CREATE INDEX "time_logs_taskId_idx" ON "time_logs"("taskId" ASC);

-- CreateIndex
CREATE INDEX "time_logs_userId_idx" ON "time_logs"("userId" ASC);

-- CreateIndex
CREATE INDEX "user_availabilities_tenantId_idx" ON "user_availabilities"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_availabilities_userId_key" ON "user_availabilities"("userId" ASC);

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email" ASC);

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId" ASC);

-- AddForeignKey
ALTER TABLE "aec_drawing_sheets" ADD CONSTRAINT "aec_drawing_sheets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aec_project_phases" ADD CONSTRAINT "aec_project_phases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aec_rfis" ADD CONSTRAINT "aec_rfis_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aec_sheet_versions" ADD CONSTRAINT "aec_sheet_versions_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "aec_drawing_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aec_site_reports" ADD CONSTRAINT "aec_site_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aec_sub_consultant_ledgers" ADD CONSTRAINT "aec_sub_consultant_ledgers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aec_submittals" ADD CONSTRAINT "aec_submittals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_types" ADD CONSTRAINT "booking_types_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_types" ADD CONSTRAINT "booking_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_bookingTypeId_fkey" FOREIGN KEY ("bookingTypeId") REFERENCES "booking_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "crm_deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_price_books" ADD CONSTRAINT "catalog_price_books_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_products_services" ADD CONSTRAINT "catalog_products_services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_accounts" ADD CONSTRAINT "crm_accounts_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_accounts" ADD CONSTRAINT "crm_accounts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_accounts" ADD CONSTRAINT "crm_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "crm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_reportsToContactId_fkey" FOREIGN KEY ("reportsToContactId") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "crm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_entity_activity_logs" ADD CONSTRAINT "crm_entity_activity_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_deliverables" ADD CONSTRAINT "financial_deliverables_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "financial_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_deliverables" ADD CONSTRAINT "financial_deliverables_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_deliverables" ADD CONSTRAINT "financial_deliverables_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_products_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_deliverables" ADD CONSTRAINT "financial_deliverables_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_deliverables" ADD CONSTRAINT "financial_deliverables_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_expense_entries" ADD CONSTRAINT "financial_expense_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_expense_entries" ADD CONSTRAINT "financial_expense_entries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_line_items" ADD CONSTRAINT "financial_line_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_products_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_line_items" ADD CONSTRAINT "financial_line_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "financial_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_project_budgets" ADD CONSTRAINT "financial_project_budgets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_project_budgets" ADD CONSTRAINT "financial_project_budgets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_quotes" ADD CONSTRAINT "financial_quotes_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_quotes" ADD CONSTRAINT "financial_quotes_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_quotes" ADD CONSTRAINT "financial_quotes_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "crm_deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_quotes" ADD CONSTRAINT "financial_quotes_priceBookId_fkey" FOREIGN KEY ("priceBookId") REFERENCES "catalog_price_books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_quotes" ADD CONSTRAINT "financial_quotes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_quotes" ADD CONSTRAINT "financial_quotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_client_change_requests" ADD CONSTRAINT "pm_client_change_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_client_change_requests" ADD CONSTRAINT "pm_client_change_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_project_documents" ADD CONSTRAINT "pm_project_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_project_documents" ADD CONSTRAINT "pm_project_documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_project_documents" ADD CONSTRAINT "pm_project_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_project_invoices" ADD CONSTRAINT "pm_project_invoices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_project_invoices" ADD CONSTRAINT "pm_project_invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_project_wiki_pages" ADD CONSTRAINT "pm_project_wiki_pages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_project_wiki_pages" ADD CONSTRAINT "pm_project_wiki_pages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_project_wiki_pages" ADD CONSTRAINT "pm_project_wiki_pages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_timesheets" ADD CONSTRAINT "pm_timesheets_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_timesheets" ADD CONSTRAINT "pm_timesheets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_timesheets" ADD CONSTRAINT "pm_timesheets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppm_portfolios" ADD CONSTRAINT "ppm_portfolios_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppm_portfolios" ADD CONSTRAINT "ppm_portfolios_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppm_resource_profiles" ADD CONSTRAINT "ppm_resource_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppm_resource_profiles" ADD CONSTRAINT "ppm_resource_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppm_risk_items" ADD CONSTRAINT "ppm_risk_items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppm_risk_items" ADD CONSTRAINT "ppm_risk_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppm_risk_items" ADD CONSTRAINT "ppm_risk_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "crm_deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "ppm_portfolios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_assignedProfileId_fkey" FOREIGN KEY ("assignedProfileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_parentRoleId_fkey" FOREIGN KEY ("parentRoleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings_custom_fields" ADD CONSTRAINT "settings_custom_fields_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "settings_layout_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings_custom_fields" ADD CONSTRAINT "settings_custom_fields_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "settings_module_schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings_email_configs" ADD CONSTRAINT "settings_email_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings_email_templates" ADD CONSTRAINT "settings_email_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings_layout_blocks" ADD CONSTRAINT "settings_layout_blocks_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "settings_module_schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings_module_schemas" ADD CONSTRAINT "settings_module_schemas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings_system_config" ADD CONSTRAINT "settings_system_config_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings_workflow_rules" ADD CONSTRAINT "settings_workflow_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_escalatedTaskId_fkey" FOREIGN KEY ("escalatedTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_linkedAccountId_fkey" FOREIGN KEY ("linkedAccountId") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_linkedContactId_fkey" FOREIGN KEY ("linkedContactId") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "social_listening_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_listening_rules" ADD CONSTRAINT "social_listening_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_audit_trail" ADD CONSTRAINT "system_audit_trail_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "financial_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "aec_project_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "aec_project_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "pm_timesheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_availabilities" ADD CONSTRAINT "user_availabilities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_availabilities" ADD CONSTRAINT "user_availabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

