// English source text is the message key. Columns: zh, ja, ko, de, it, ru, es.
const rows = `
Domain details|域名明细|ドメインの内訳|도메인 상세|Domain-Details|Dettagli dei domini|Детали доменов|Detalles de dominios
View website details|查看网站详情|サイトの詳細を見る|웹사이트 상세 보기|Website-Details ansehen|Mostra dettagli del sito|Подробнее о сайте|Ver detalles del sitio
{count} domains|{count} 个域名|{count}ドメイン|도메인 {count}개|{count} Domains|{count} domini|{count} доменов|{count} dominios
Child times can overlap. The main-domain total counts overlaps once.|各域名的时长可能重叠，主域名总时长已去重。|各ドメインの時間は重複する場合があります。メインドメインの合計は重複を除外します。|각 도메인의 시간은 겹칠 수 있습니다. 기본 도메인의 총시간은 중복을 제외합니다.|Die Zeiten einzelner Domains können sich überschneiden. Die Hauptdomain zählt Überschneidungen nur einmal.|I tempi dei singoli domini possono sovrapporsi. Il totale del dominio principale conta le sovrapposizioni una sola volta.|Время отдельных доменов может пересекаться. В итоге основного домена пересечения учитываются один раз.|Los tiempos de los dominios pueden coincidir. El total del dominio principal cuenta las coincidencias una sola vez.
Older merged time may include overlaps; earlier versions did not store intervals.|旧记录合并后可能包含重叠时长，旧版未保存时间段，无法还原去重。|過去の統合時間には重複が含まれる場合があります。旧版は時間区間を保存していませんでした。|이전 기록의 병합 시간에는 중복이 있을 수 있습니다. 이전 버전은 시간 구간을 저장하지 않았습니다.|Ältere zusammengeführte Zeiten können Überschneidungen enthalten; frühere Versionen speicherten keine Zeitintervalle.|I vecchi tempi uniti possono contenere sovrapposizioni; le versioni precedenti non salvavano gli intervalli.|Старые объединённые данные могут содержать пересечения: прежние версии не сохраняли временные интервалы.|Los tiempos antiguos combinados pueden incluir coincidencias; las versiones anteriores no guardaban intervalos.
All subdomains of the same main domain count once. Different websites can overlap; total browser time counts each moment once. Close tabs you no longer want to count.|同一主域名下的所有子域名合并计时，重叠时长只计一次。不同网站可同时计时，浏览器总时长不重复累加。不想计时的网页请关闭。|同じメインドメインのサブドメインはまとめて重複なく計測します。異なるサイトの時間は重複できますが、ブラウザの合計は各瞬間を一度だけ計測します。不要なタブは閉じてください。|같은 기본 도메인의 모든 하위 도메인은 합쳐서 한 번만 계산합니다. 사이트별 시간은 겹칠 수 있지만 브라우저 총시간은 중복되지 않습니다. 불필요한 탭은 닫으세요.|Alle Subdomains einer Hauptdomain zählen zusammen nur einmal. Verschiedene Webseiten können sich überschneiden; die Browserzeit zählt jeden Moment einmal. Schließe nicht benötigte Tabs.|Tutti i sottodomini dello stesso dominio principale contano insieme una sola volta. I siti possono sovrapporsi; il totale del browser conta ogni istante una volta. Chiudi le schede non necessarie.|Все поддомены одного основного домена учитываются вместе без повторов. Время разных сайтов может пересекаться, но общее время браузера не дублируется. Закройте ненужные вкладки.|Todos los subdominios del mismo dominio principal cuentan juntos una sola vez. Los sitios pueden coincidir; el total del navegador cuenta cada instante una vez. Cierra las pestañas innecesarias.
Block Local IPs|屏蔽本地 IP|ローカルIPを除外|로컬 IP 제외|Lokale IPs ausschließen|Escludi IP locali|Исключать локальные IP|Excluir IP locales
Exclude local and private addresses from future tracking. Existing history is kept.|不再统计本地和私有地址，已有历史记录保持不变。|ローカル・プライベートアドレスを今後の計測から除外します。履歴は保持されます。|로컬 및 사설 주소를 앞으로 측정하지 않습니다. 기존 기록은 유지됩니다.|Lokale und private Adressen künftig nicht erfassen. Bestehende Daten bleiben erhalten.|Escludi gli indirizzi locali e privati dal conteggio futuro. La cronologia viene conservata.|Не учитывать локальные и частные адреса в дальнейшем. История сохраняется.|Excluye las direcciones locales y privadas del registro futuro. Se conserva el historial.
Invalid or incompatible WebTime backup. Your data has not been changed.|WebTime 备份无效或不兼容，你的数据未被更改。|無効または非対応のWebTimeバックアップです。データは変更されていません。|잘못되었거나 호환되지 않는 WebTime 백업입니다. 데이터는 변경되지 않았습니다.|Ungültige oder inkompatible WebTime-Sicherung. Deine Daten bleiben unverändert.|Backup WebTime non valido o incompatibile. I tuoi dati non sono stati modificati.|Некорректная или несовместимая копия WebTime. Данные не изменены.|Copia de WebTime no válida o incompatible. Tus datos no se han modificado.
Settings|设置|設定|설정|Einstellungen|Impostazioni|Настройки|Ajustes
Language|语言|言語|언어|Sprache|Lingua|Язык|Idioma
Follow your system language, or choose your own.|跟随系统语言，或手动选择。|システムの言語に合わせるか、手動で選択できます。|시스템 언어를 따르거나 직접 선택하세요.|Systemsprache verwenden oder selbst wählen.|Usa la lingua di sistema o scegline una.|Используйте язык системы или выберите другой.|Usa el idioma del sistema o elige otro.
System|跟随系统|システムに合わせる|시스템 설정|System|Sistema|Как в системе|Sistema
Theme|主题|テーマ|테마|Design|Tema|Тема|Tema
Dark|深色|ダーク|어둡게|Dunkel|Scuro|Тёмная|Oscuro
Light|浅色|ライト|밝게|Hell|Chiaro|Светлая|Claro
Animation|动画|アニメーション|애니메이션|Animation|Animazione|Анимация|Animación
Full|完整|すべて|전체|Vollständig|Completa|Полная|Completa
Reduced|减少|控えめ|줄이기|Reduziert|Ridotta|Уменьшенная|Reducida
Off|关闭|オフ|끄기|Aus|Disattivata|Отключена|Desactivada
Appearance|外观|外観|모양|Darstellung|Aspetto|Внешний вид|Apariencia
Tracking|计时规则|計測|시간 측정|Zeiterfassung|Monitoraggio|Учёт времени|Registro
Your data|你的数据|データ|내 데이터|Deine Daten|I tuoi dati|Ваши данные|Tus datos
Make yourself at home.|按你的习惯设置。|お好みに合わせて設定しましょう。|취향에 맞게 설정하세요.|Richte dich ein.|Personalizza il tuo spazio.|Настройте всё под себя.|Personaliza tu espacio.
A quieter view, day or night.|日夜皆宜，舒适浏览。|昼も夜も、落ち着いた画面で。|낮에도 밤에도 편안한 화면.|Angenehm bei Tag und Nacht.|Una vista confortevole, giorno e notte.|Комфортный вид днём и ночью.|Una vista cómoda, de día y de noche.
Your system’s reduced motion preference is always respected.|始终遵循系统的减少动态效果设置。|システムの視差効果を減らす設定を常に優先します。|시스템의 동작 줄이기 설정을 항상 따릅니다.|Die Systemeinstellung für reduzierte Bewegung wird immer beachtet.|La preferenza di sistema per il movimento ridotto viene sempre rispettata.|Системная настройка уменьшения движения всегда учитывается.|Siempre se respeta la preferencia del sistema de reducir el movimiento.
All open, loaded websites are counted, including background tabs and windows. Keyboard inactivity and window focus do not pause tracking.|所有已打开且已加载的网页均计时，包括后台标签页和窗口。无键鼠操作或切换焦点不会暂停计时。|読み込まれたすべてのタブを、背景のタブやウィンドウも含めて計測します。操作がなくても、フォーカスが外れても計測は続きます。|백그라운드 탭과 창을 포함해 열려 있고 로드된 모든 웹사이트를 측정합니다. 입력이 없거나 포커스가 바뀌어도 계속 측정합니다.|Alle geöffneten, geladenen Webseiten zählen, auch im Hintergrund. Inaktivität und Fensterfokus pausieren die Erfassung nicht.|Vengono conteggiati tutti i siti aperti e caricati, anche in secondo piano. L’inattività e il cambio di finestra non interrompono il conteggio.|Учитываются все открытые и загруженные сайты, включая фоновые вкладки и окна. Бездействие и смена фокуса не останавливают учёт.|Se cuentan todos los sitios abiertos y cargados, incluso en segundo plano. La inactividad y el cambio de foco no pausan el registro.
Multiple tabs on the same domain count once. Different websites can overlap; total browser time counts each moment once. Close tabs you no longer want to count.|同一域名的多个标签页只计一次。不同网站可同时计时，浏览器总时长不重复累加。不想计时的网页请关闭。|同じドメインのタブは重複計測しません。異なるサイトは並行して計測しますが、ブラウザの合計時間は重複しません。計測不要のタブは閉じてください。|같은 도메인의 탭은 한 번만 계산합니다. 사이트별 시간은 겹칠 수 있지만 브라우저 총시간은 중복되지 않습니다. 측정하지 않을 탭은 닫으세요.|Tabs derselben Domain zählen nur einmal. Verschiedene Webseiten können sich zeitlich überschneiden; die Browserzeit zählt jeden Moment nur einmal. Schließe nicht benötigte Tabs.|Le schede dello stesso dominio contano una sola volta. I tempi dei siti possono sovrapporsi; il totale del browser conta ogni istante una volta sola. Chiudi le schede che non vuoi conteggiare.|Вкладки одного домена учитываются один раз. Время разных сайтов может пересекаться, но общее время браузера не дублируется. Закройте вкладки, которые не нужно учитывать.|Las pestañas del mismo dominio cuentan una sola vez. Los tiempos de distintos sitios pueden coincidir; el total del navegador cuenta cada instante una vez. Cierra las pestañas que no quieras contar.
Locked screens, private windows, internal pages, and tabs discarded or frozen by the browser are excluded.|锁屏期间、无痕窗口、浏览器内部页面，以及被浏览器卸载或冻结的标签页不计时。|画面ロック中、シークレットウィンドウ、内部ページ、ブラウザにより破棄・凍結されたタブは対象外です。|화면 잠금 중, 시크릿 창, 내부 페이지, 브라우저가 삭제하거나 정지한 탭은 제외됩니다.|Bildschirmsperren, private Fenster, interne Seiten sowie verworfene oder eingefrorene Tabs sind ausgeschlossen.|Sono esclusi i periodi a schermo bloccato, le finestre private, le pagine interne e le schede sospese o congelate.|Блокировка экрана, приватные окна, внутренние страницы, выгруженные и замороженные вкладки исключены.|Se excluyen los periodos con pantalla bloqueada, ventanas privadas, páginas internas y pestañas descartadas o congeladas.
Keep a copy|保留副本|コピーを保存|사본 보관|Kopie sichern|Conserva una copia|Сохранить копию|Guardar una copia
Export your local statistics as a JSON backup.|将本地统计导出为 JSON 备份。|ローカルの統計をJSON形式で保存します。|로컬 통계를 JSON 백업으로 내보냅니다.|Lokale Statistik als JSON sichern.|Esporta le statistiche locali in un backup JSON.|Экспорт локальной статистики в JSON.|Exporta tus estadísticas locales como copia JSON.
Export data ↗|导出数据 ↗|データをエクスポート ↗|데이터 내보내기 ↗|Daten exportieren ↗|Esporta dati ↗|Экспорт данных ↗|Exportar datos ↗
Restore a backup|恢复备份|バックアップを復元|백업 복원|Sicherung wiederherstellen|Ripristina un backup|Восстановить копию|Restaurar una copia
Validated before replacing your current statistics.|替换当前统计前会验证备份。|現在の統計を置き換える前に検証します。|현재 통계를 바꾸기 전에 백업을 검증합니다.|Vor dem Ersetzen wird die Sicherung geprüft.|Il backup viene verificato prima di sostituire le statistiche.|Копия проверяется перед заменой статистики.|Se valida antes de sustituir las estadísticas actuales.
Import data|导入数据|データをインポート|데이터 가져오기|Daten importieren|Importa dati|Импорт данных|Importar datos
Start fresh|重新开始|最初から始める|새로 시작|Neu beginnen|Ricomincia|Начать заново|Empezar de nuevo
Permanently delete all recorded website time.|永久删除所有已记录的网站时长。|記録されたサイトの時間をすべて完全に削除します。|기록된 웹사이트 시간을 모두 영구 삭제합니다.|Alle erfassten Webseitenzeiten dauerhaft löschen.|Elimina definitivamente tutti i tempi registrati.|Навсегда удалить всё записанное время сайтов.|Elimina permanentemente todo el tiempo registrado.
Clear all data|清空所有数据|すべてのデータを削除|모든 데이터 삭제|Alle Daten löschen|Elimina tutti i dati|Удалить все данные|Borrar todos los datos
Your browsing stays yours.|你的浏览数据只属于你。|閲覧データは、あなただけのもの。|내 탐색 데이터는 나만의 것.|Deine Browserdaten bleiben bei dir.|I tuoi dati di navigazione restano tuoi.|Ваши данные остаются у вас.|Tus datos de navegación siguen siendo tuyos.
No servers, accounts, analytics or telemetry.|无服务器、账号、分析或遥测。|サーバー、アカウント、分析、テレメトリはありません。|서버, 계정, 분석, 원격 측정이 없습니다.|Keine Server, Konten, Analysen oder Telemetrie.|Nessun server, account, analisi o telemetria.|Без серверов, аккаунтов, аналитики и телеметрии.|Sin servidores, cuentas, análisis ni telemetría.
Cancel|取消|キャンセル|취소|Abbrechen|Annulla|Отмена|Cancelar
Clear data|清空数据|データを削除|데이터 삭제|Daten löschen|Elimina dati|Удалить данные|Borrar datos
Replace data|替换数据|データを置き換え|데이터 교체|Daten ersetzen|Sostituisci dati|Заменить данные|Sustituir datos
Clear all data?|清空所有数据？|すべてのデータを削除しますか？|모든 데이터를 삭제할까요?|Alle Daten löschen?|Eliminare tutti i dati?|Удалить все данные?|¿Borrar todos los datos?
Replace your current data?|替换当前数据？|現在のデータを置き換えますか？|현재 데이터를 교체할까요?|Aktuelle Daten ersetzen?|Sostituire i dati attuali?|Заменить текущие данные?|¿Sustituir los datos actuales?
This permanently removes your browsing statistics from this device. Your appearance settings will stay. Export a backup first if you want to keep a copy.|这会永久删除此设备上的浏览统计，保留你的外观设置。如需保留数据，请先导出备份。|この端末の閲覧統計を完全に削除します。外観設定は保持されます。必要なら先にバックアップを保存してください。|이 기기의 탐색 통계를 영구 삭제합니다. 모양 설정은 유지됩니다. 필요하면 먼저 백업을 내보내세요.|Die Browserstatistik auf diesem Gerät wird dauerhaft gelöscht. Die Darstellung bleibt erhalten. Exportiere bei Bedarf vorher eine Sicherung.|Le statistiche su questo dispositivo verranno eliminate definitivamente. Le impostazioni grafiche resteranno. Esporta prima un backup se necessario.|Статистика на этом устройстве будет удалена навсегда. Настройки оформления сохранятся. При необходимости сначала экспортируйте копию.|Se borrarán permanentemente las estadísticas de este dispositivo. Se conservará la apariencia. Exporta antes una copia si deseas guardarlas.
This backup passed validation. Importing will replace your current statistics and settings. Export a backup first if you want to keep them.|备份已通过验证。导入将替换当前统计和设置。如需保留，请先导出备份。|検証に成功しました。インポートすると現在の統計と設定が置き換わります。必要なら先にバックアップを保存してください。|백업 검증을 통과했습니다. 가져오면 현재 통계와 설정이 교체됩니다. 보관하려면 먼저 백업을 내보내세요.|Die Sicherung ist gültig. Der Import ersetzt aktuelle Statistiken und Einstellungen. Sichere sie bei Bedarf zuerst.|Il backup è valido. L’importazione sostituirà statistiche e impostazioni attuali. Esporta prima una copia se vuoi conservarle.|Копия проверена. Импорт заменит текущую статистику и настройки. Чтобы сохранить их, сначала экспортируйте копию.|La copia es válida. La importación sustituirá las estadísticas y ajustes actuales. Exporta antes una copia si deseas conservarlos.
Settings saved.|设置已保存。|設定を保存しました。|설정이 저장되었습니다.|Einstellungen gespeichert.|Impostazioni salvate.|Настройки сохранены.|Ajustes guardados.
Backup exported.|备份已导出。|バックアップを保存しました。|백업을 내보냈습니다.|Sicherung exportiert.|Backup esportato.|Копия экспортирована.|Copia exportada.
Backup restored.|备份已恢复。|バックアップを復元しました。|백업을 복원했습니다.|Sicherung wiederhergestellt.|Backup ripristinato.|Копия восстановлена.|Copia restaurada.
All recorded data cleared.|所有记录已清空。|すべての記録を削除しました。|모든 기록을 삭제했습니다.|Alle Aufzeichnungen gelöscht.|Tutti i dati registrati eliminati.|Все записи удалены.|Todos los registros borrados.
Backup exceeds the 8 MB import limit.|备份超过 8 MB 导入上限。|バックアップが8 MBの上限を超えています。|백업이 8 MB 제한을 초과합니다.|Die Sicherung überschreitet das Limit von 8 MB.|Il backup supera il limite di 8 MB.|Копия превышает лимит 8 МБ.|La copia supera el límite de 8 MB.
Invalid settings.|设置无效。|設定が無効です。|잘못된 설정입니다.|Ungültige Einstellungen.|Impostazioni non valide.|Некорректные настройки.|Ajustes no válidos.
Unable to read backup. Check that it is a valid WebTime JSON file.|无法读取备份，请确认是有效的 WebTime JSON 文件。|バックアップを読み込めません。有効なWebTime JSONファイルか確認してください。|백업을 읽을 수 없습니다. 유효한 WebTime JSON 파일인지 확인하세요.|Sicherung nicht lesbar. Prüfe die WebTime-JSON-Datei.|Impossibile leggere il backup. Verifica il file JSON di WebTime.|Не удалось прочитать копию. Проверьте JSON-файл WebTime.|No se puede leer la copia. Comprueba el archivo JSON de WebTime.
The background service is unavailable. Reload the extension.|后台服务不可用，请重新加载扩展。|バックグラウンドサービスが利用できません。拡張機能を再読み込みしてください。|백그라운드 서비스를 사용할 수 없습니다. 확장 프로그램을 새로고침하세요.|Hintergrunddienst nicht verfügbar. Erweiterung neu laden.|Servizio in background non disponibile. Ricarica l’estensione.|Фоновая служба недоступна. Перезагрузите расширение.|El servicio en segundo plano no está disponible. Recarga la extensión.
Today|今天|今日|오늘|Heute|Oggi|Сегодня|Hoy
7 Days|7 天|7日間|7일|7 Tage|7 giorni|7 дней|7 días
30 Days|30 天|30日間|30일|30 Tage|30 giorni|30 дней|30 días
Websites|网站|サイト|웹사이트|Webseiten|Siti web|Сайты|Sitios web
Dashboard|统计面板|ダッシュボード|대시보드|Übersicht|Panoramica|Обзор|Panel
← Dashboard|← 统计面板|← ダッシュボード|← 대시보드|← Übersicht|← Panoramica|← Обзор|← Panel
Open Dashboard|打开统计面板|ダッシュボードを開く|대시보드 열기|Übersicht öffnen|Apri panoramica|Открыть обзор|Abrir panel
Main navigation|主导航|メインナビゲーション|기본 탐색|Hauptnavigation|Navigazione principale|Основная навигация|Navegación principal
Browser time statistics|浏览器时长统计|ブラウザ利用時間の統計|브라우저 시간 통계|Browserzeitstatistik|Statistiche del browser|Статистика времени браузера|Estadísticas del navegador
Loading your time…|正在加载统计…|時間を読み込み中…|통계를 불러오는 중…|Zeit wird geladen…|Caricamento…|Загрузка статистики…|Cargando estadísticas…
Your time. Your device.|你的时间，你的设备。|あなたの時間。あなたの端末。|나의 시간. 나의 기기.|Deine Zeit. Dein Gerät.|Il tuo tempo. Il tuo dispositivo.|Ваше время. Ваше устройство.|Tu tiempo. Tu dispositivo.
Stored locally · No account · No tracking|本地存储 · 无需账号 · 无追踪|ローカル保存 · アカウント不要 · 追跡なし|로컬 저장 · 계정 없음 · 추적 없음|Lokal gespeichert · Kein Konto · Kein Tracking|Dati locali · Nessun account · Nessun tracciamento|Локально · Без аккаунта · Без слежки|Datos locales · Sin cuenta · Sin rastreo
Total browser time|浏览器总时长|ブラウザの合計時間|브라우저 총시간|Gesamte Browserzeit|Tempo totale del browser|Общее время браузера|Tiempo total del navegador
Total browser time · overlaps counted once|浏览器总时长 · 重叠时间不重复计算|ブラウザの合計時間 · 重複なし|브라우저 총시간 · 중복 제외|Browserzeit · Ohne Doppelzählung|Tempo browser · Senza duplicati|Время браузера · Без повторного учёта|Tiempo del navegador · Sin duplicados
Concurrent websites count once|同时使用多个网站时总时长只计一次|同時に開いたサイトの時間は重複計測しません|동시 사용 시간은 한 번만 계산|Gleichzeitige Webseiten zählen einmal|I siti simultanei contano una volta|Одновременное время учитывается один раз|Los sitios simultáneos cuentan una vez
Active websites|活跃网站|利用サイト|활성 웹사이트|Aktive Webseiten|Siti attivi|Активные сайты|Sitios activos
Sessions|访问次数|セッション|세션|Sitzungen|Sessioni|Сеансы|Sesiones
Daily average|日均时长|1日平均|일평균|Tagesdurchschnitt|Media giornaliera|В среднем за день|Promedio diario
Avg. website session|平均访问时长|平均セッション時間|평균 방문 시간|Ø Webseiten-Sitzung|Sessione media per sito|Средний сеанс сайта|Sesión media por sitio
No previous data yet|暂无历史对比数据|比較データはまだありません|이전 데이터 없음|Noch keine Vergleichsdaten|Nessun dato precedente|Нет данных для сравнения|Sin datos anteriores
Activity today|今日活动|今日のアクティビティ|오늘의 활동|Heutige Aktivität|Attività di oggi|Активность сегодня|Actividad de hoy
Daily activity|每日活动|毎日のアクティビティ|일별 활동|Tägliche Aktivität|Attività giornaliera|Активность по дням|Actividad diaria
Your activity will appear as you browse|开始浏览后即可查看活动|閲覧するとアクティビティが表示されます|탐색하면 활동이 표시됩니다|Beim Surfen erscheint deine Aktivität|L’attività apparirà durante la navigazione|Активность появится при просмотре сайтов|Tu actividad aparecerá al navegar
Top websites|常用网站|よく使うサイト|상위 웹사이트|Meistgenutzte Webseiten|Siti principali|Популярные сайты|Sitios principales
View all websites ↗|查看所有网站 ↗|すべてのサイト ↗|모든 웹사이트 보기 ↗|Alle Webseiten ↗|Tutti i siti ↗|Все сайты ↗|Ver todos los sitios ↗
View all ↗|查看全部 ↗|すべて表示 ↗|모두 보기 ↗|Alle anzeigen ↗|Mostra tutti ↗|Показать все ↗|Ver todos ↗
Usage breakdown|使用分布|利用の内訳|사용 비율|Nutzungsverteilung|Ripartizione d’uso|Распределение времени|Distribución de uso
Share of website time|网站时长占比|サイト時間の割合|웹사이트 시간 비율|Anteil der Webseitenzeit|Quota del tempo sui siti|Доля времени сайтов|Proporción del tiempo en sitios
Website time|网站总时长|サイト利用時間|웹사이트 시간|Webseitenzeit|Tempo sui siti|Время сайтов|Tiempo en sitios
Browser rhythm|浏览节奏|閲覧リズム|탐색 패턴|Browserrhythmus|Ritmo di navigazione|Ритм просмотра|Ritmo de navegación
Your browsing, in focus|浏览记录，一目了然|閲覧を振り返る|한눈에 보는 탐색|Dein Surfen im Blick|La navigazione a colpo d’occhio|Ваш просмотр в деталях|Tu navegación en detalle
All-time usage · Stored on this device|累计使用 · 存储于此设备|累計利用時間 · この端末に保存|전체 사용 시간 · 이 기기에 저장|Gesamtnutzung · Auf diesem Gerät|Utilizzo totale · Su questo dispositivo|За всё время · На этом устройстве|Uso histórico · En este dispositivo
Search websites…|搜索网站…|サイトを検索…|웹사이트 검색…|Webseiten suchen…|Cerca siti…|Поиск сайтов…|Buscar sitios…
Search websites|搜索网站|サイトを検索|웹사이트 검색|Webseiten suchen|Cerca siti|Поиск сайтов|Buscar sitios
Sort websites|网站排序|サイトを並べ替え|웹사이트 정렬|Webseiten sortieren|Ordina siti|Сортировка сайтов|Ordenar sitios
Most time|时长最多|利用時間順|사용 시간순|Meiste Zeit|Più tempo|По времени|Más tiempo
Last visited|最近访问|最終訪問順|최근 방문순|Zuletzt besucht|Ultima visita|По последнему визиту|Última visita
Alphabetically|按名称|名前順|이름순|Alphabetisch|Alfabetico|По алфавиту|Alfabéticamente
No websites match your search.|没有匹配的网站。|一致するサイトがありません。|일치하는 웹사이트가 없습니다.|Keine passenden Webseiten.|Nessun sito corrispondente.|Совпадений не найдено.|No hay sitios coincidentes.
No websites yet. Your first browsing session will appear here.|暂无网站，首次浏览后会显示在这里。|まだサイトがありません。閲覧を始めると表示されます。|아직 웹사이트가 없습니다. 탐색을 시작하면 표시됩니다.|Noch keine Webseiten. Deine erste Sitzung erscheint hier.|Ancora nessun sito. La prima sessione apparirà qui.|Пока нет сайтов. Первый сеанс появится здесь.|Aún no hay sitios. Tu primera sesión aparecerá aquí.
This website has no recorded data.|此网站暂无记录。|このサイトの記録はありません。|이 웹사이트의 기록이 없습니다.|Für diese Webseite gibt es keine Daten.|Nessun dato per questo sito.|Нет данных об этом сайте.|No hay datos de este sitio.
Back to websites|返回网站列表|サイト一覧に戻る|웹사이트 목록으로|Zurück zu Webseiten|Torna ai siti|Назад к сайтам|Volver a sitios
← Websites|← 网站列表|← サイト一覧|← 웹사이트|← Webseiten|← Siti web|← Сайты|← Sitios web
Activity · Last 30 days|活动 · 最近 30 天|アクティビティ · 過去30日間|활동 · 최근 30일|Aktivität · Letzte 30 Tage|Attività · Ultimi 30 giorni|Активность · Последние 30 дней|Actividad · Últimos 30 días
Other|其他|その他|기타|Sonstige|Altro|Другое|Otros
Your browsing mix will appear here.|浏览分布将显示在这里。|閲覧の内訳がここに表示されます。|탐색 비율이 여기에 표시됩니다.|Deine Nutzungsverteilung erscheint hier.|La distribuzione apparirà qui.|Распределение появится здесь.|La distribución aparecerá aquí.
Your first session starts when you browse.|开始浏览即开始记录。|閲覧を始めると計測が始まります。|탐색을 시작하면 기록됩니다.|Beim Surfen beginnt die erste Sitzung.|La prima sessione inizia quando navighi.|Учёт начнётся при просмотре сайтов.|Tu primera sesión comienza al navegar.
Everything stays on this device.|所有数据均保留在此设备。|すべてのデータはこの端末に保存されます。|모든 데이터는 이 기기에 보관됩니다.|Alles bleibt auf diesem Gerät.|Tutto resta su questo dispositivo.|Всё остаётся на этом устройстве.|Todo queda en este dispositivo.
A little perspective starts with a little browsing.|开始浏览，了解你的时间。|閲覧を始めて、時間を見直しましょう。|탐색을 시작하고 시간을 확인하세요.|Ein wenig Surfen schafft Überblick.|Inizia a navigare per conoscere il tuo tempo.|Начните просмотр, чтобы увидеть статистику.|Empieza a navegar para conocer tu tiempo.
Visit a website to start your first session.|访问网站即可开始首次计时。|サイトを開くと最初の計測が始まります。|웹사이트를 열면 첫 기록이 시작됩니다.|Öffne eine Webseite für deine erste Sitzung.|Visita un sito per iniziare la prima sessione.|Откройте сайт для первого сеанса.|Visita un sitio para iniciar tu primera sesión.
Live|计时中|計測中|측정 중|Aktiv|In corso|Идёт учёт|En curso
Paused|已暂停|一時停止|일시 중지|Pausiert|In pausa|Приостановлено|En pausa
Inactive|未计时|待機中|비활성|Inaktiv|Inattivo|Неактивно|Inactivo
Your time, quietly accounted for.|静静记录你的时间。|あなたの時間を、静かに記録。|조용히 기록하는 나의 시간.|Deine Zeit, unaufdringlich erfasst.|Il tuo tempo, registrato con discrezione.|Ваше время под ненавязчивым учётом.|Tu tiempo, registrado discretamente.
Demo preview. Changes here do not affect extension data.|演示预览，此处更改不影响扩展数据。|デモです。変更は拡張機能のデータに影響しません。|데모입니다. 변경 사항은 확장 데이터에 영향을 주지 않습니다.|Demo. Änderungen betreffen keine Erweiterungsdaten.|Demo. Le modifiche non influiscono sui dati dell’estensione.|Демо. Изменения не влияют на данные расширения.|Demo. Los cambios no afectan a los datos de la extensión.
DEMO PREVIEW · Synthetic data · Nothing is recorded|演示预览 · 模拟数据 · 不记录活动|デモ · サンプルデータ · 記録されません|데모 · 샘플 데이터 · 기록하지 않음|DEMO · Beispieldaten · Keine Aufzeichnung|DEMO · Dati simulati · Nessuna registrazione|ДЕМО · Пример данных · Запись отключена|DEMO · Datos simulados · No se registra nada
BROWSER PREVIEW · Load the unpacked extension to start tracking|浏览器预览 · 加载解压的扩展以开始计时|プレビュー · 拡張機能を読み込むと計測を開始します|미리보기 · 압축 해제된 확장 프로그램을 로드해 시작|VORSCHAU · Entpackte Erweiterung laden, um zu starten|ANTEPRIMA · Carica l’estensione per iniziare|ПРОСМОТР · Загрузите расширение для начала учёта|VISTA PREVIA · Carga la extensión para empezar
Settings · WebTime|设置 · WebTime|設定 · WebTime|설정 · WebTime|Einstellungen · WebTime|Impostazioni · WebTime|Настройки · WebTime|Ajustes · WebTime
Hourly activity chart|每小时活动图|時間別アクティビティ|시간별 활동 차트|Stündliche Aktivität|Attività oraria|Активность по часам|Actividad por horas
Daily activity chart|每日活动图|日別アクティビティ|일별 활동 차트|Tägliche Aktivität|Attività giornaliera|Активность по дням|Actividad por días
Website usage breakdown|网站使用分布|サイト利用の内訳|웹사이트 사용 비율|Webseitennutzung|Utilizzo dei siti|Распределение по сайтам|Distribución por sitios
Last {count} days|最近 {count} 天|過去{count}日間|최근 {count}일|Letzte {count} Tage|Ultimi {count} giorni|Последние {count} дней|Últimos {count} días
{value} daily average|日均 {value}|1日平均 {value}|일평균 {value}|{value} im Tagesdurchschnitt|Media giornaliera {value}|В среднем {value} в день|Promedio diario {value}
{count} days · {value} daily average|{count} 天 · 日均 {value}|{count}日間 · 1日平均 {value}|{count}일 · 일평균 {value}|{count} Tage · Ø {value} pro Tag|{count} giorni · Media {value}|{count} дней · В среднем {value}|{count} días · Promedio {value}
Peak activity · {value}|活动高峰 · {value}|ピーク · {value}|활동 최고점 · {value}|Höchste Aktivität · {value}|Picco di attività · {value}|Пик активности · {value}|Máxima actividad · {value}
{value}% from yesterday|较昨天 {value}%|昨日比 {value}%|어제 대비 {value}%|{value}% gegenüber gestern|{value}% rispetto a ieri|{value}% ко вчерашнему дню|{value}% respecto a ayer
{value}% from previous period|较上一周期 {value}%|前期間比 {value}%|이전 기간 대비 {value}%|{value}% gegenüber Vorperiode|{value}% rispetto al periodo precedente|{value}% к прошлому периоду|{value}% respecto al periodo anterior
{count} websites · {value}|{count} 个网站 · {value}|{count}サイト · {value}|웹사이트 {count}개 · {value}|{count} Webseiten · {value}|{count} siti · {value}|{count} сайтов · {value}|{count} sitios · {value}
`;
export const languages = ["en", "zh", "ja", "ko", "de", "it", "ru", "es"];
export const messages = Object.fromEntries(
  rows
    .trim()
    .split("\n")
    .map((row) => {
      const [key, ...values] = row.split("|");
      if (values.length !== 7) throw Error(`Invalid translation row: ${key}`);
      return [
        key,
        Object.fromEntries(
          ["zh", "ja", "ko", "de", "it", "ru", "es"].map((locale, i) => [
            locale,
            values[i],
          ]),
        ),
      ];
    }),
);
