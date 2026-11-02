"""Rebuild publication figures from the supplied, frozen aggregate CSVs.

Run: MPLCONFIGDIR=/tmp/topo-article-mpl python3 scripts/article-assets/render_figures.py
No live calls; no extrapolation of partial months; no per-person data.
"""
from pathlib import Path
import csv
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

from typography import REPO, register_fonts, embed_fonts
register_fonts()
DATA = Path(__file__).resolve().parent / 'data'
OUT = REPO / 'public/articles/ai-code-integration-review'
OUT.mkdir(parents=True, exist_ok=True)
BG, INK, MUTED, GRID = '#f6f3ec', '#1e3044', '#344556', '#cdced2'
BLUE, RUST, GREY = '#3e617b', '#a64b2a', '#7a8794'
# The Latin web subset omits arrow glyphs. Use a symbol fallback for those only;
# all ordinary labels are measured and rendered with the bundled Space Grotesk.
plt.rcParams.update({'font.family':['Space Grotesk','DejaVu Sans','sans-serif'],'font.size':11,'text.color':INK,
 'axes.labelcolor':MUTED,'xtick.color':MUTED,'ytick.color':MUTED,
 'axes.edgecolor':GRID,'figure.facecolor':BG,'axes.facecolor':BG,
 'svg.fonttype':'none','svg.hashsalt':'ai-code-integration-review','savefig.facecolor':BG})

def read(name):
    with (DATA / name).open() as f: return list(csv.DictReader(f))

def frame(ax, ylabel=None):
    ax.spines[['top','right','left']].set_visible(False)
    ax.tick_params(axis='both', length=0, pad=8)
    ax.grid(axis='y', color=GRID, linewidth=.6, zorder=0)
    if ylabel: ax.set_ylabel(ylabel, labelpad=14)
    ax.set_axisbelow(True)

def heading(fig, tag, title, sub):
    fig.text(.08,.96,tag.upper(),fontsize=9,fontfamily='Space Mono',color=BLUE,va='top')
    fig.text(.08,.915,title,fontsize=23,fontweight='bold',va='top')
    fig.text(.08,.86,sub,fontsize=11,color=MUTED,va='top')

def save(fig,name,footer):
    fig.text(.08,.045,footer,fontsize=9,color=MUTED,va='bottom',linespacing=1.65)
    svg = OUT/f'{name}.svg'
    fig.savefig(svg, metadata={'Date': None})
    svg.write_text('\n'.join(line.rstrip() for line in embed_fonts(svg.read_text()).splitlines()) + '\n')
    # PNGs are review artifacts; the deployed page uses SVG.
    local = REPO / 'writing/ai-code-review/figures'
    local.mkdir(parents=True, exist_ok=True)
    fig.savefig(local/f'{name}.png',dpi=180)
    (local/f'{name}.svg').write_text(svg.read_text())
    plt.close(fig)

def months(ax,rows,step=2):
    ticks=list(range(0,len(rows),step))
    if ticks[-1]!=len(rows)-1: ticks.append(len(rows)-1)
    ax.set_xticks(ticks,[rows[i]['month'][2:].replace('-',' / ') for i in ticks])
    ax.set_xlim(-.25,len(rows)-.1)

prs=[r for r in read('monthly_prs.csv') if r['month']>='2025-05']
x=np.arange(len(prs))
fig,axes=plt.subplots(2,1,figsize=(12,8.2),sharex=True)
fig.subplots_adjust(left=.10,right=.94,top=.76,bottom=.19,hspace=.3)
heading(fig,'Topo / integration','More merged changes. Similar elapsed delay.',
        'May 2025–August 2026 · two different measures, shown separately')
series=[('merged_prs','Merged PRs / month',BLUE),('median_lead_time_hours','Opening → merge / hours',RUST)]
comparisons={}
for ax,(key,label,color) in zip(axes,series):
    vals=np.array([float(r[key]) for r in prs]); ax.plot(x,vals,'o-',color=color,lw=2.4,ms=4)
    frame(ax,label); ax.set_ylim(0,max(vals)*1.30)
    first,last=vals[:3].mean(),vals[-3:].mean()
    comparisons[key]={'may_jul_2025_mean':float(first),'jun_aug_2026_mean':float(last)}
    for a,b,v in [(0,2,first),(13,15,last)]:
        ax.hlines(v,a,b,color=INK,ls='--',lw=1.3)
    ax.text(.01,.91,f'3-month averages: {first:.1f} → {last:.1f}',transform=ax.transAxes,fontsize=12,fontweight='bold')
    ax.annotate(f'{vals[-1]:.0f}' if key=='merged_prs' else f'{vals[-1]:.2f}',(x[-1],vals[-1]),xytext=(-8,10),textcoords='offset points',ha='right',color=color)
months(axes[-1],prs,3)
save(fig,'01-throughput-and-delay','Source: monthly_prs.csv. Delay panel = monthly medians; annotations = means of those medians.\nAugust through 27th. Active author accounts increased from 4 to 7–8; this is not fixed-team productivity.')

q=read('shift_left_quarterly.csv')
keys=['pre_tool_use','post_tool_use','pre_commit','pre_push','ci']
labels=['Before tool action','After agent edit','Pre-commit','Pre-push','CI']
mat=np.array([[int(r[k]) for r in q] for k in keys])
fig,ax=plt.subplots(figsize=(12,6.8));fig.subplots_adjust(left=.20,right=.95,top=.73,bottom=.23)
heading(fig,'Topo / feedback placement','Checks moved into the authoring loop.',
        'Configured placements per stage · quarterly snapshots, 2024 Q1–2026 Q3')
ax.imshow(mat,cmap=LinearSegmentedColormap.from_list('ink',[BG,'#c2d4db',BLUE]),vmin=0,vmax=21,aspect='auto')
ax.set_xticks(range(len(q)),[r['quarter'].replace('-','\n') for r in q],fontsize=9)
ax.set_yticks(range(5),labels)
for (i,j),v in np.ndenumerate(mat): ax.text(j,i,str(v) if v else '·',ha='center',va='center',color='white' if v>=13 else INK,fontsize=12)
ax.tick_params(length=0,pad=10);ax.spines[:].set_visible(False)
save(fig,'02-check-placement','Source: shift_left_quarterly.csv. Q3 2026: 26 configured placements before CI, plus 21 in CI.\nA rule may appear at several stages. Counts measure placement, not coverage, usage or effectiveness.')

rows=read('ci_breakdown_monthly.csv'); dates=sorted({r['month'] for r in rows})
fig,ax=plt.subplots(figsize=(12,7));fig.subplots_adjust(left=.10,right=.77,top=.76,bottom=.22)
heading(fig,'Topo / interpreting CI','A failed review is not a failed test.',
        'Failure rates per workflow run · October 2025–August 2026')
for cat,label,color,style in [('ai_review','AI review',RUST,'-'),('other','Other automation',GREY,':'),('ci_core','Core CI',BLUE,'--')]:
    rs=[r for r in rows if r['category']==cat]; vals=[100*int(r['failures'])/int(r['runs']) for r in rs]
    ax.plot(range(len(rs)),vals,color=color,ls=style,marker='o',ms=4,lw=2.5)
    offset={'ai_review':0,'other':-3,'ci_core':4}[cat]
    ax.annotate(f'{label}  {vals[-1]:.1f}%',(len(rs)-1,vals[-1]),xytext=(14,offset),textcoords='offset points',va='center',color=color,fontweight='bold')
frame(ax,'Failed runs / retained runs (%)');ax.set_ylim(0,65);months(ax,[{'month':m} for m in dates],2)
ax.annotate('675 / 1,202 review runs\nfailed in April (56.2%)',(6,56.16),xytext=(4,61),arrowprops={'arrowstyle':'-','color':RUST},fontsize=10,color=RUST)
save(fig,'03-ci-decomposition','Source: ci_breakdown_monthly.csv. Each category has its own denominator; reruns count separately.\nAI-review failures include findings and incomplete/no-verdict runs. Not precision or distinct defective PRs.\nOctober from 8th; August through 27th. Preview-only category omitted; cancellation/skip exclusions follow source.')

loop=[r for r in read('monthly_loop_quality.csv') if r['month']>='2025-11']
fig,axes=plt.subplots(2,1,figsize=(12,8),sharex=True,gridspec_kw={'height_ratios':[3,1]})
fig.subplots_adjust(left=.10,right=.94,top=.74,bottom=.21,hspace=.25)
heading(fig,'Topo / an incomplete autonomy signal','Less late human editing. Attention unmeasured.',
        'Eligible merged AI PRs with no human commit after the last identified agent commit')
vals=[float(r['first_pass_merge_rate_pct']) for r in loop]; n=[int(r['first_pass_population']) for r in loop]
axes[0].plot(range(len(loop)),vals,'o-',color=BLUE,lw=2.5)
axes[0].set_ylim(0,103);frame(axes[0],'Eligible PRs (%)')
for i in [0,8,9]:axes[0].annotate(f'{vals[i]:.2f}%',(i,vals[i]),xytext=(-7,-20 if i==8 else 10),textcoords='offset points',ha='center',color=BLUE,fontweight='bold')
axes[1].bar(range(len(n)),n,color='#b0c5d0',width=.55);frame(axes[1],'PRs in sample');axes[1].set_ylim(0,470)
for i,v in enumerate(n):axes[1].text(i,v+8,str(v),ha='center',fontsize=9)
months(axes[1],loop,2)
save(fig,'04-human-commit-proxy','Source: monthly_loop_quality.csv. Conditional on merged, attributable AI PRs. August is partial.\nEarlier edits, coaching, review, internal agent retries and abandoned sessions are not measured here.\nThe CSV calls this “first_pass_merge_rate”; it is not first-attempt success or absence of human involvement.')

bugs=[r for r in read('linear_bugs_monthly.csv') if r['month']>='2025-11']
# Validate source fields rather than relying on column positions.
assert 'bugs_created' in bugs[0], list(bugs[0])
fig,axes=plt.subplots(2,1,figsize=(12,8),sharex=True)
fig.subplots_adjust(left=.10,right=.94,top=.75,bottom=.22,hspace=.3)
heading(fig,'Topo / the denominator matters','Fewer tickets. A larger drop per merged PR.',
        'Recorded bug-ticket population · November 2025–August 2026')
for ax,key,label,color in [(axes[0],'bugs_created','Tickets / month',BLUE),(axes[1],'bugs_created_per_100_merged_prs','Tickets / 100 merged PRs',RUST)]:
    vals=[float(r[key]) for r in bugs];ax.plot(range(len(bugs)),vals,'o-',color=color,lw=2.4)
    frame(ax,label);ax.set_ylim(0,max(vals)*1.25)
    for i in [0,len(bugs)-1]:ax.annotate(f'{vals[i]:.0f}' if key=='bugs_created' else f'{vals[i]:.1f}',(i,vals[i]),xytext=(0,12),textcoords='offset points',ha='center',color=color,fontweight='bold')
months(axes[1],bugs,2)
save(fig,'05-tickets-and-denominator','Source: linear_bugs_monthly.csv. Union of Ticketing-team and Bug-labeled issues; imperfect labels.\nTickets are not linked to introducing deployments; counts include duplicates/cancellations and reporting lag.\nAugust through 27th. Neither series is a measured deployment change failure rate.')

# Conceptual illustration, intentionally separated from the empirical charts.
fig,ax=plt.subplots(figsize=(12,7.2));ax.set_xlim(0,12);ax.set_ylim(0,6);ax.axis('off')
fig.subplots_adjust(left=.05,right=.96,top=.78,bottom=.19)
heading(fig,'Concept / migration example','Two green branches can violate a shared invariant.',
        'Validate the combination, repair its graph, then refresh the evidence')
def box(x,y,w,h,title,sub,color=BLUE):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.04,rounding_size=0.12',facecolor=BG,edgecolor=color,lw=1.5))
    ax.text(x+w/2,y+h*.66,title,ha='center',va='center',fontsize=12,fontweight='bold',color=color)
    ax.text(x+w/2,y+h*.27,sub,ha='center',va='center',fontsize=10,color=MUTED)
def arrow(a,b):ax.add_patch(FancyArrowPatch(a,b,arrowstyle='-|>',mutation_scale=12,color=MUTED,lw=1.2))
box(.15,3.5,2.2,1.3,'Branch A','parent → A\none head')
box(.15,1.2,2.2,1.3,'Branch B','parent → B\none head')
box(3.35,2.35,2.45,1.4,'Combined candidate','A + B after parent\ntwo heads',RUST)
box(6.7,2.35,2.2,1.4,'Repair + verify','merge revision\ncheck the new candidate')
box(9.55,2.35,2.15,1.4,'Acceptance','evidence refers to\nthis exact version')
arrow((2.4,4.1),(3.3,3.35));arrow((2.4,1.85),(3.3,2.75));arrow((5.85,3.05),(6.65,3.05));arrow((8.95,3.05),(9.5,3.05))
ax.text(6, .3,'New patch, new base or relevant environment change → recheck affected evidence',ha='center',fontsize=12,color=RUST)
save(fig,'06-candidate-evidence','Conceptual diagram, not an incident trace. Based on the Topo migration-graph invariant.\nOne revision head does not prove safe locking, backfill behavior or compatibility with a running older application.')

(DATA.parent/'calculations.json').write_text(json.dumps(comparisons,indent=2)+'\n')
print(f'Wrote SVG + PNG figures to {OUT}')
