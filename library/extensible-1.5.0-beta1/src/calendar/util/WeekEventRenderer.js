/*!
 * Extensible 1.5.0-beta1
 * Copyright(c) 2010-2011 Extensible, LLC
 * licensing@ext.ensible.com
 * http://ext.ensible.com
 */
/* @private
 * This is an internal helper class for the calendar views and should not be overridden.
 * It is responsible for the base event rendering logic underlying all views based on a 
 * box-oriented layout that supports day spanning (MonthView, MultiWeekView, DayHeaderView).
 */
Ext.define('Extensible.calendar.util.WeekEventRenderer', {
    
    requires: ['Ext.core.DomHelper'],
    
    statics: {
        // private
        getEventRow: function(id, week, index){
            var indexOffset = 1; //skip row with date #'s
            var evtRow, wkRow = Ext.get(id+'-wk-'+week);
            if(wkRow){
                var table = wkRow.child('.ext-cal-evt-tbl', true);
                evtRow = table.tBodies[0].childNodes[index+indexOffset];
                if(!evtRow){
                    evtRow = Ext.core.DomHelper.append(table.tBodies[0], '<tr></tr>');
                }
            }
            return Ext.get(evtRow);
        },
        
        render: function(o){
            var w = 0, grid = o.eventGrid, 
                dt = Ext.Date.clone(o.viewStart),
                eventTpl = o.tpl,
                max = o.maxEventsPerDay != undefined ? o.maxEventsPerDay : 999,
                weekCount = o.weekCount < 1 ? 6 : o.weekCount,
                dayCount = o.weekCount == 1 ? o.dayCount : 7;
            
            for(; w < weekCount; w++){
                var row, d = 0, wk = grid[w];
                var startOfWeek = Ext.Date.clone(dt);
                var endOfWeek = Extensible.Date.add(startOfWeek, {days: dayCount, millis: -1});
                
                for(; d < dayCount; d++){
                    if(wk && wk[d]){
                        var ev = emptyCells = skipped = 0,
                            day = wk[d], ct = day.length, evt;
                        
                        for(; ev < ct; ev++){
                            if(!day[ev]){
                                emptyCells++;
                                continue;
                            }
                            if(emptyCells > 0 && ev-emptyCells < max){
                                row = this.getEventRow(o.id, w, ev-emptyCells);
                                var cellCfg = {
                                    tag: 'td',
                                    cls: 'ext-cal-ev',
                                    html: '&#160;',
                                    id: o.id+'-empty-'+ct+'-day-' + Ext.Date.format(dt, 'Ymd')
                                }
                                if(emptyCells > 1 && max-ev > emptyCells){
                                    cellCfg.rowspan = Math.min(emptyCells, max-ev);
                                }
                                Ext.core.DomHelper.append(row, cellCfg);
                                emptyCells = 0;
                            }
                            
                            if(ev >= max){
                                skipped++;
                                continue;
                            }
                            evt = day[ev];
                            
                            if(!evt.isSpan || evt.isSpanStart){ //skip non-starting span cells
                                var item = evt.data || evt.event.data;
                                item._weekIndex = w;
                                item._renderAsAllDay = item[Extensible.calendar.data.EventMappings.IsAllDay.name] || evt.isSpanStart;
                                item.spanLeft = item[Extensible.calendar.data.EventMappings.StartDate.name].getTime() < startOfWeek.getTime();
                                item.spanRight = item[Extensible.calendar.data.EventMappings.EndDate.name].getTime() > endOfWeek.getTime();
                                item.spanCls = (item.spanLeft ? (item.spanRight ? 'ext-cal-ev-spanboth' : 
                                    'ext-cal-ev-spanleft') : (item.spanRight ? 'ext-cal-ev-spanright' : ''));
                                        
                                var row = this.getEventRow(o.id, w, ev),
                                    cellCfg = {
                                        tag: 'td',
                                        cls: 'ext-cal-ev',
                                        cn : eventTpl.apply(o.templateDataFn(item))
                                    },
                                    diff = Extensible.Date.diffDays(dt, item[Extensible.calendar.data.EventMappings.EndDate.name]) + 1,
                                    cspan = Math.min(diff, dayCount-d);
                                    
                                if(cspan > 1){
                                    cellCfg.colspan = cspan;
                                }
                                Ext.core.DomHelper.append(row, cellCfg);
                            }
                        }
                        if(ev > max){
                            row = this.getEventRow(o.id, w, max);
                            Ext.core.DomHelper.append(row, {
                                tag: 'td',
                                cls: 'ext-cal-ev-more',
                                id: 'ext-cal-ev-more-'+Ext.Date.format(dt, 'Ymd'),
                                cn: {
                                    tag: 'a',
                                    html: Ext.String.format(o.getMoreText(skipped), skipped)
                                }
                            });
                        }
                        if(ct < o.evtMaxCount[w]){
                            row = this.getEventRow(o.id, w, ct);
                            if(row){
                                var cellCfg = {
                                    tag: 'td',
                                    cls: 'ext-cal-ev',
                                    //html: '&#160;',
                                    id: o.id+'-empty-'+(ct+1)+'-day-'+Ext.Date.format(dt, 'Ymd')
                                };
                                var rowspan = o.evtMaxCount[w] - ct;
                                if(rowspan > 1){
                                    cellCfg.rowspan = rowspan;
                                }
                                Ext.core.DomHelper.append(row, cellCfg);
                            }
                        }
                    }else{
                        row = this.getEventRow(o.id, w, 0);
                        if(row){
                            var cellCfg = {
                                tag: 'td',
                                cls: 'ext-cal-ev',
                                html: '&#160;',
                                id: o.id+'-empty-day-'+Ext.Date.format(dt, 'Ymd')
                            };
                            if(o.evtMaxCount[w] > 1){
                                cellCfg.rowspan = o.evtMaxCount[w];
                            }
                            Ext.core.DomHelper.append(row, cellCfg);
                        }
                    }
                    dt = Extensible.Date.add(dt, {days: 1});
                }
            }
        }
    }
});
