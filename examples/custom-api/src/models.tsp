import "@common-grants/core";

using JsonSchema;
using CommonGrants;

@jsonSchema
namespace CustomAPI.CustomModels;

enum OpportunityStatus {
    Draft,
    Published,
    Closed,
}

model OpportunityNumber extends Models.CustomField {
    name: "Funding Opportunity Number";
    type: Models.CustomFieldType.string;

    @example("ABC-2025-001")
    value: string;

    description: "The unique identifier for a given opportunity within this API";
}

model CustomOpportunity extends Models.Opportunity {
    customFields: {
        fundingOpportunityNumber: OpportunityNumber;
    };
    
    /** The status of the opportunity */
    status: OpportunityStatus;
}
