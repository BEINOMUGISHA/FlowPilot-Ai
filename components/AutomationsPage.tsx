
import React, { useState } from 'react';
import { AutomationRule, TriggerType, ActionType } from '../types';
import { Zap, Play, MoreHorizontal, Plus, ArrowRight, Settings, Trash2, X, Check, Activity, Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AutomationsPageProps {
  automations: AutomationRule[];
  onToggle: (id: string) => void;
  onAdd: (rule: AutomationRule) => void;
  onDelete: (id: string) => void;
}

export const AutomationsPage: React.FC<AutomationsPageProps> = ({ automations, onToggle, onAdd, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Builder State
  const [builderStep, setBuilderStep] = useState(1);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: '',
    description: '',
    triggerType: 'KEYWORD_MATCH',
    triggerCondition: '',
    actionType: 'NOTIFY',
    actionTarget: '',
    active: true
  });

  const handleSaveRule = () => {
    if (!newRule.name || !newRule.triggerType || !newRule.actionType) return;
    
    const rule: AutomationRule = {
      id: uuidv4(),
      name: newRule.name,
      description: newRule.description || 'Custom workflow',
      triggerType: newRule.triggerType as TriggerType,
      triggerCondition: newRule.triggerCondition,
      actionType: newRule.actionType as ActionType,
      actionTarget: newRule.actionTarget,
      active: true,
      executionCount: 0
    };
    
    onAdd(rule);
    setIsModalOpen(false);
    // Reset
    setNewRule({
        name: '', description: '', triggerType: 'KEYWORD_MATCH', actionType: 'NOTIFY', active: true
    });
    setBuilderStep(1);
  };

  const getTriggerLabel = (type: TriggerType) => {
    switch(type) {
      case 'ON_CREATE': return 'Task Created';
      case 'ON_COMPLETE': return 'Task Completed';
      case 'ON_OVERDUE': return 'Task Overdue';
      case 'KEYWORD_MATCH': return 'Keyword Match';
      default: return type;
    }
  };

  const getActionLabel = (type: ActionType) => {
    switch(type) {
      case 'NOTIFY': return 'Send Notification';
      case 'SET_PRIORITY': return 'Change Priority';
      case 'DELETE': return 'Delete Task';
      default: return type;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Automations</h2>
          <p className="text-slate-500 mt-1">Let FlowPilot handle the busy work.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl flex items-center space-x-2 hover:shadow-lg hover:shadow-indigo-200 hover:scale-105 transition-all font-medium"
        >
          <Plus size={18} />
          <span>New Workflow</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Card (Visual Placeholder) */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer h-full min-h-[240px]"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors shadow-sm">
             <Plus size={32} />
          </div>
          <span className="font-bold text-lg text-slate-600 group-hover:text-indigo-700">Create Workflow</span>
          <span className="text-sm mt-1">Trigger → Action</span>
        </button>

        {automations.map(rule => (
          <div key={rule.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl shadow-sm ${rule.active ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Zap size={24} />
                </div>
                <div className="relative group/menu">
                    <button className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-50 transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                    {/* Delete Context Menu */}
                    <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block z-10">
                        <button 
                           onClick={() => onDelete(rule.id)}
                           className="bg-white border border-slate-200 shadow-lg rounded-lg py-2 px-4 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Trash2 size={12} /> Delete
                        </button>
                    </div>
                </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-1">{rule.name}</h3>
                <p className="text-xs text-slate-500 mb-4 h-8 line-clamp-2">{rule.description}</p>
                
                {/* Logic Flow */}
                <div className="space-y-3 mt-4 relative">
                <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-100 -z-10"></div>
                
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase w-8 text-right shrink-0">If</span>
                    <div className="text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-slate-700 w-full font-medium flex justify-between items-center">
                        <span>{getTriggerLabel(rule.triggerType)}</span>
                        {rule.triggerCondition && <span className="bg-slate-200 px-1.5 rounded text-[10px] text-slate-600">{rule.triggerCondition}</span>}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase w-8 text-right shrink-0">Then</span>
                    <div className="text-xs bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 text-indigo-700 w-full font-medium flex justify-between items-center">
                        <span>{getActionLabel(rule.actionType)}</span>
                        {rule.actionTarget && <span className="bg-indigo-200 px-1.5 rounded text-[10px] text-indigo-800 max-w-[60px] truncate">{rule.actionTarget}</span>}
                    </div>
                </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
               <div className="flex gap-3">
                   <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1" title="Last Run">
                        <Clock size={12} />
                        {rule.lastRun ? new Date(rule.lastRun).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                   </div>
                   <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1" title="Execution Count">
                        <Activity size={12} />
                        {rule.executionCount}
                   </div>
               </div>
               <button 
                 onClick={() => onToggle(rule.id)}
                 className={`
                   relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                   ${rule.active ? 'bg-emerald-500' : 'bg-slate-200'}
                 `}
               >
                 <span className={`
                   pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                   ${rule.active ? 'translate-x-4' : 'translate-x-0'}
                 `} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE WORKFLOW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Zap className="text-indigo-500" size={20} />
                        New Automation
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-8">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center mb-8">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${builderStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
                        <div className={`w-16 h-1 bg-slate-100 mx-2 ${builderStep >= 2 ? 'bg-indigo-600' : ''}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${builderStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
                         <div className={`w-16 h-1 bg-slate-100 mx-2 ${builderStep >= 3 ? 'bg-indigo-600' : ''}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${builderStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>3</div>
                    </div>

                    <div className="min-h-[250px]">
                        {/* STEP 1: TRIGGER */}
                        {builderStep === 1 && (
                            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                                <h4 className="text-lg font-bold text-slate-800">When should this run?</h4>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Trigger Event</label>
                                    <select 
                                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newRule.triggerType}
                                        onChange={e => setNewRule({...newRule, triggerType: e.target.value as TriggerType})}
                                    >
                                        <option value="KEYWORD_MATCH">Keyword Match (Title/Desc)</option>
                                        <option value="ON_COMPLETE">Task Completed</option>
                                        <option value="ON_OVERDUE">Task is Overdue</option>
                                        <option value="ON_CREATE">Task Created (All)</option>
                                    </select>
                                </div>
                                
                                {newRule.triggerType === 'KEYWORD_MATCH' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-2">Keyword</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g., Urgent, Client, Invoice"
                                            value={newRule.triggerCondition || ''}
                                            onChange={e => setNewRule({...newRule, triggerCondition: e.target.value})}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 2: ACTION */}
                        {builderStep === 2 && (
                            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                                <h4 className="text-lg font-bold text-slate-800">What should happen?</h4>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Action</label>
                                    <select 
                                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newRule.actionType}
                                        onChange={e => setNewRule({...newRule, actionType: e.target.value as ActionType})}
                                    >
                                        <option value="NOTIFY">Send Notification</option>
                                        <option value="SET_PRIORITY">Change Priority</option>
                                        <option value="DELETE">Delete Task</option>
                                    </select>
                                </div>

                                {newRule.actionType === 'NOTIFY' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-2">Message</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g., Attention required!"
                                            value={newRule.actionTarget || ''}
                                            onChange={e => setNewRule({...newRule, actionTarget: e.target.value})}
                                        />
                                    </div>
                                )}

                                {newRule.actionType === 'SET_PRIORITY' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-2">Set Priority To</label>
                                        <select 
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={newRule.actionTarget || 'high'}
                                            onChange={e => setNewRule({...newRule, actionTarget: e.target.value})}
                                        >
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 3: REVIEW */}
                        {builderStep === 3 && (
                            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                                <h4 className="text-lg font-bold text-slate-800">Name your automation</h4>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Rule Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg"
                                        placeholder="My Awesome Rule"
                                        value={newRule.name || ''}
                                        onChange={e => setNewRule({...newRule, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Description</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="What does this do?"
                                        value={newRule.description || ''}
                                        onChange={e => setNewRule({...newRule, description: e.target.value})}
                                    />
                                </div>
                                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600">
                                    <span className="font-bold">Logic Summary:</span><br/>
                                    IF <span className="text-indigo-600 font-bold">{getTriggerLabel(newRule.triggerType as TriggerType)}</span> {newRule.triggerCondition && `(${newRule.triggerCondition})`} 
                                    <br/>THEN <span className="text-emerald-600 font-bold">{getActionLabel(newRule.actionType as ActionType)}</span> {newRule.actionTarget && `(${newRule.actionTarget})`}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-between bg-slate-50/50">
                    {builderStep > 1 ? (
                        <button 
                            onClick={() => setBuilderStep(prev => prev - 1)}
                            className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                        >
                            Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {builderStep < 3 ? (
                        <button 
                            onClick={() => setBuilderStep(prev => prev + 1)}
                            className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                            Next <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button 
                            onClick={handleSaveRule}
                            disabled={!newRule.name}
                            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                        >
                            <Check size={18} /> Create Automation
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
