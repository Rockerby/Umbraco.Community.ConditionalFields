using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Web.Common.Authorization;

namespace ConditionalFields.Controllers
{
    [VersionedApiBackOfficeRoute("conditionalfields")]
    //[Authorize(Policy = AuthorizationPolicies.SectionAccessSettings)]
    [AllowAnonymous]
    [MapToApi(Constants.ApiName)]
    [ApiExplorerSettings(GroupName = Constants.ApiName)]
    public class ConditionalFieldsApiControllerBase : ManagementApiControllerBase
    {
    }
}
