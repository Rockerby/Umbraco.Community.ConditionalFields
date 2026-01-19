using ConditionalProperties.Models;
using ConditionalProperties.Notifications;
using ConditionalProperties.Services;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Strings;
using uSync.BackOffice;
using uSync.BackOffice.Configuration;
using uSync.BackOffice.Services;
using uSync.BackOffice.SyncHandlers;
using uSync.BackOffice.SyncHandlers.Interfaces;
using uSync.BackOffice.SyncHandlers.Models;
using uSync.Core;
using uSync.Core.Serialization;

namespace ConditionalProperties.uSync.Handlers
{
    [SyncHandler("CdConfigurationDefinitionHandler", "Cd Configuraton Handler", "ConditionalDisplayers", 100)]
    public class CdConfigurationDefinitionHandler : SyncHandlerRoot<CdConfigurationDefinition, CdConfigurationDefinition>,
        ISyncHandler,
        INotificationAsyncHandler<CdSavedNotification>
    {
        private readonly IConditionalPropertiesConfigurationService _conditionalFieldsConfigurationService;

        public CdConfigurationDefinitionHandler(ILogger<SyncHandlerRoot<CdConfigurationDefinition, CdConfigurationDefinition>> logger,
            AppCaches appCaches,
            IShortStringHelper shortStringHelper,
            ISyncFileService syncFileService,
            ISyncEventService mutexService,
            ISyncConfigService uSyncConfig,
            ISyncItemFactory itemFactory,
            IConditionalPropertiesConfigurationService conditionalFieldsConfigurationService) : base(logger, appCaches, shortStringHelper, syncFileService, mutexService, uSyncConfig, itemFactory)
        {
            _conditionalFieldsConfigurationService = conditionalFieldsConfigurationService;
        }

        public async Task HandleAsync(CdSavedNotification notification, CancellationToken cancellationToken)
        {
            try
            {
                var handlerFolders = GetDefaultHandlerFolders();
                var definition = new CdConfigurationDefinition(notification.PropertyTypeKey, notification.Configuration);
                var attempts = await ExportAsync(definition, handlerFolders, DefaultConfig);
                foreach (var attempt in attempts)
                {
                    if (attempt.Success && attempt.FileName is not null)
                    {
                        await CleanUpAsync(definition, attempt.FileName, handlerFolders[handlerFolders.Length - 1]);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to create uSync export file");
            }
        }

        protected override Task<IEnumerable<uSyncAction>> DeleteMissingItemsAsync(CdConfigurationDefinition parent, IEnumerable<Guid> keysToKeep, bool reportOnly)
                            => Task.FromResult(Enumerable.Empty<uSyncAction>());

        protected override Task<IEnumerable<CdConfigurationDefinition>> GetChildItemsAsync(CdConfigurationDefinition? parent)
                            => Task.FromResult(Enumerable.Empty<CdConfigurationDefinition>());

        protected override Task<IEnumerable<CdConfigurationDefinition>> GetFoldersAsync(CdConfigurationDefinition? parent)
                            => Task.FromResult(Enumerable.Empty<CdConfigurationDefinition>());

        protected override async Task<CdConfigurationDefinition?> GetFromServiceAsync(CdConfigurationDefinition? item)
        {
            if(item is null)
            {
                return null;
            }

            var definition = await _conditionalFieldsConfigurationService.GetConfigurationAsync(item.PropertyTypeKey);
            if (definition is null)
            {
                return null;
            }

            return new CdConfigurationDefinition(item.PropertyTypeKey, definition);
        }


        protected override string GetItemName(CdConfigurationDefinition item)
                            => item.PropertyTypeKey.ToString();
    }
}
