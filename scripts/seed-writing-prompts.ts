import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { writingPrompts } from "../db/schema";

const DIRECTIONS = `The following task is designed to measure your ability to write an argumentative essay. You will be presented with a debatable issue (identified in the Key Question), along with different perspectives that provide additional context for the issue by introducing various claims that have been made within that debate. You will then write an argumentative essay in which you take a position within this ongoing conversation, while addressing at least one of the arguments and ideas presented in the other perspectives.

Before writing your essay, you will have 15 minutes for prewriting analysis. Use this time to read and analyze the perspectives in this conversation and reflect on the questions we've included to help you generate ideas for your essay.

After the prewriting analysis, you will have 35 minutes to write your essay.

No specialized background knowledge is required or expected for this writing exercise. How well you write is much more important than how much you write.

A strong response will:
• Clearly state the thesis of your argument
• Develop your thesis throughout your essay by connecting specific examples to your overall thesis and explaining their relevance with clear reasoning
• Address the complexities and implications of your essay's position (for example, by identifying and addressing one or more potential counterarguments)

Your essay should demonstrate your ability to:
• Clearly state a position on the issue and analyze the relationship between that position and one or more of the other perspectives
• Develop and support ideas with reasoning and examples
• Organize ideas clearly and logically
• Communicate ideas using clear and effectively chosen language`;

const STANDARD_PREWRITING = [
  { id: "compelling", text: "Which perspective(s) do you find most compelling?" },
  { id: "insights", text: "What relevant insights do you see in the perspective(s)?" },
  { id: "values", text: "What principles or values do you see at work in the perspective(s)?" },
  { id: "strengths", text: "What strengths and weaknesses can you find in the perspective(s)?" },
  { id: "knowledge", text: "What knowledge do you already have about this issue? Consider information you have read or heard, including things you've learned at home or school." },
  { id: "personal_values", text: "What values influence your position on this issue? Consider your worldview or belief system, as well as any guiding principles or convictions you hold." },
  { id: "experiences", text: "What experiences do you have that might be relevant to this issue? Consider any personal experience you might have with this or similar issues." },
];

const PROMPTS = [
  {
    title: "Purpose of College",
    topic: `The principal aim of an undergraduate liberal arts education has traditionally been to cultivate a student's understanding of a broad range of important areas of knowledge, from the fine arts to the sciences, philosophy, language, economics—these things have been seen as crucial to understanding, and participating in, the larger world beyond the classroom. Some, however, believe that this kind of education has failed to provide students with the practical skills necessary to succeed in an increasingly competitive and career-focused society, suggesting we need to reconsider what university programs should look like. Such proposals are often framed as a pragmatic response to trends in the economy and predictions about the skills, knowledge, and training that will best serve students' career readiness. Given this proposed shift in emphasis toward skills-based education, it's worth considering what the overall goal of an undergraduate education should be.`,
    keyQuestion: "To what extent do colleges and universities serve their students' best interests when they emphasize career preparation?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from a career advice blog",
        text: `"Recruiting talent for a variety of organizations across industries, I've witnessed how the demands of today's job market make the cultivation of practical skills and specialized training more important than ever. If a student's time at university is an investment that ought to prepare them for the future, then surely career readiness must factor highly into what such institutions aim to provide. Schools that recognize this and adapt will produce graduates who are better equipped to explore a wide array of career paths, and who can adapt to changing job roles within ever-evolving industries. That's the way for today's student to make a meaningful contribution to society—by being well-equipped to grow and change within an economic reality that is itself always growing and changing."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a university's promotional brochure",
        text: `"In college, I began making my way through this world and crafting a life for myself that reflects my values. But what are my values, and how did I come to hold these values rather than others? Once I realized I didn't have to unquestioningly accept the norms and values that had been given to me, I was free to decide for myself which values I wanted to hold on to, which to leave behind, and even which new values I felt drawn to. College provided the context in which I could reflect on my values, the reasons and evidence for them, and whether they are the right values for me. Would my classmates and I have been able to test out our ideas and ideals so effectively if my university was only focused on practical career skills? I don't believe so—such work requires a dedicated exploration of ideas and knowledge for their own sake."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from a textbook on the sociology of education",
        text: `"Across cultures, higher education has served primarily to aid the process of socialization by instilling cultural values, norms, and behaviors, thereby integrating people into the fabric of their respective societies. A university degree provides more than just those so-called 'soft' skills necessary for making white-collar work function smoothly, like interpersonal communication and teamwork. This emblem of accomplishment, the college degree, also provides a social signal that one is befitted to the upper-middle class, if not higher. By serving as class membership badges, undergraduate degrees perpetuate social stratification and hierarchies, with the result that access to opportunity is determined largely not by merit, but more so by one's ability to conform to a particular set of values—in short, to 'fit in.' In this manner, college places subtle constraints on students that go far beyond the more well-known problem of financial barriers to access."`,
      },
      {
        label: "Perspective 4",
        source: "an excerpt from a journal on higher education",
        text: `"The traditional structure of higher education needs a transformative overhaul. The modern university has its origins in medieval schools, which stressed rote memorization and obedience to the centralized authority of teachers, reflecting the broader civic and political context of those schools. But in today's world, we don't accept such a rigid, top-down system in our civic and political life. We expect citizens to be agents in the evolution of their communities. Likewise, there's no reason to accept it in our educational lives. Instead, we ought to honor the agency of students in orchestrating their own educational experience. Some colleges have begun to change in the right direction, emphasizing dialogue over monologue and problem-solving over sheer information retention. This new form of relationship between student and university is critical, where teachers collaborate with students to discover new truths together, where student learning is based on their own guided learning experiences, and where curricula are created around topics that engage students' intrinsic motivation to learn. This moves us closer to creating the flourishing, diverse society we need."`,
      },
    ],
    source: "lsac_official_sample",
  },
  {
    title: "Technology and Privacy",
    topic: `The rapid advancement of digital technology has fundamentally altered the relationship between individuals and their personal information. From social media platforms that track user behavior to government surveillance programs justified by national security concerns, the boundaries of privacy are being continuously redrawn. While some argue that increased data collection leads to better services, greater security, and more efficient governance, others contend that the erosion of privacy represents a fundamental threat to individual autonomy and democratic society. As technology continues to evolve faster than the laws and norms designed to regulate it, the question of how to balance the benefits of data-driven innovation with the protection of personal privacy has become one of the defining issues of our time.`,
    keyQuestion: "To what extent should individuals be willing to sacrifice personal privacy in exchange for the benefits that data-driven technologies provide?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from a technology industry publication",
        text: `"The data economy has created unprecedented opportunities for innovation and efficiency. When users share their data, they receive personalized services, better healthcare predictions, and more relevant information. The companies that collect this data invest billions in security and use it to create products that genuinely improve people's lives. Privacy concerns, while understandable, often stem from a misunderstanding of how data is actually used. Most data collection is anonymized and aggregated—no one is reading your individual emails or tracking your specific movements. The real question isn't whether to share data, but how to ensure it's used responsibly. Opting out of the data economy means opting out of the modern world's greatest benefits."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a civil liberties organization's report",
        text: `"Privacy is not merely a preference—it is a fundamental right that underpins all other freedoms. Without privacy, there can be no genuine freedom of thought, expression, or association. History has shown repeatedly that when governments or corporations gain unchecked access to personal information, that power is inevitably abused. The argument that 'if you have nothing to hide, you have nothing to fear' fundamentally misunderstands the purpose of privacy. Privacy exists not to protect wrongdoing, but to protect the space in which individuals can develop their thoughts, beliefs, and identities free from external pressure. The convenience offered by data-driven services is real, but it comes at a cost that most people neither fully understand nor meaningfully consent to."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from an academic paper on digital ethics",
        text: `"The privacy debate is often framed as a binary choice between security and freedom, but this framing obscures the deeper structural issues at play. The real problem is not data collection itself, but the asymmetry of power it creates. When a handful of corporations and government agencies possess detailed profiles of billions of people, while those people have little knowledge of or control over how their information is used, the resulting power imbalance undermines the foundations of democratic governance. What we need is not simply more privacy protections, but a fundamental restructuring of data ownership—one that gives individuals genuine control over their digital identities and ensures that the economic value generated by personal data is shared more equitably."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Criminal Justice Reform",
    topic: `The criminal justice system in many countries faces criticism from multiple directions. Some argue that the system is too lenient, failing to adequately deter crime or protect victims. Others contend that it is excessively punitive, disproportionately affecting marginalized communities and prioritizing punishment over rehabilitation. Recent years have seen growing interest in alternative approaches to justice, including restorative justice programs that bring together offenders and victims, diversion programs that redirect nonviolent offenders away from incarceration, and community-based interventions that address the root causes of criminal behavior. As societies grapple with rising incarceration costs and persistent recidivism rates, the question of what the criminal justice system should ultimately aim to achieve has taken on renewed urgency.`,
    keyQuestion: "Should the primary goal of the criminal justice system be punishment of offenders, or rehabilitation and reintegration into society?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from a law enforcement journal",
        text: `"The criminal justice system exists first and foremost to protect the public. When someone commits a crime, particularly a violent one, the community has a right to expect that the offender will face consequences proportional to the harm they have caused. This is not about vengeance—it is about maintaining the social contract that allows communities to function. Punishment serves as both a deterrent to potential offenders and an acknowledgment of the suffering experienced by victims. While rehabilitation programs can play a supplementary role, they should never come at the expense of accountability. A system that prioritizes the comfort of offenders over the safety of victims sends a dangerous message about the value society places on law-abiding behavior."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a social worker's memoir",
        text: `"In my twenty years working with incarcerated individuals, I have seen firsthand how punishment alone fails to address the underlying causes of criminal behavior. Many of the people I work with grew up in poverty, experienced abuse or neglect, struggled with addiction, or lacked access to education and mental health services. Simply locking them away does nothing to address these root causes—and in many cases, the experience of incarceration itself creates new traumas that make reoffending more likely. The countries with the lowest recidivism rates are those that invest heavily in rehabilitation, education, and reintegration support. If our goal is truly to reduce crime and create safer communities, we need to move beyond a punishment-first mentality."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from a philosophy of law textbook",
        text: `"Both the punishment and rehabilitation frameworks share a common flaw: they center the state's response to crime on the offender, largely ignoring the needs of victims and the broader community. Restorative justice offers a fundamentally different approach by bringing together offenders, victims, and community members in a structured dialogue aimed at repairing harm and rebuilding relationships. This process requires offenders to take genuine responsibility for their actions—not through imposed punishment, but through direct engagement with the consequences of their behavior. Critics argue that restorative justice is too 'soft,' but research consistently shows that victims who participate in restorative processes report higher satisfaction than those who go through traditional court proceedings, and offenders who participate are significantly less likely to reoffend."`,
      },
      {
        label: "Perspective 4",
        source: "an excerpt from an economics research paper",
        text: `"From a purely economic standpoint, the current incarceration-heavy approach to criminal justice is indefensible. The cost of incarcerating a single individual often exceeds the cost of a year at a top university. Meanwhile, the economic productivity lost when millions of working-age adults are imprisoned or burdened with criminal records that prevent employment represents a staggering waste of human capital. Investment in prevention—quality education, mental health services, substance abuse treatment, and economic opportunity in underserved communities—yields far greater returns than investment in prisons. The question is not whether we can afford to shift toward prevention and rehabilitation, but whether we can afford not to."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Artificial Intelligence in Society",
    topic: `Artificial intelligence is rapidly transforming nearly every sector of society, from healthcare and education to transportation and creative industries. Proponents celebrate AI's potential to solve complex problems, increase efficiency, and democratize access to information and services. Critics, however, warn of significant risks, including job displacement, algorithmic bias, erosion of human agency, and the concentration of power in the hands of a few technology companies. As AI systems become more capable and autonomous, societies face urgent questions about how to govern these technologies, who should benefit from them, and what role humans should play in an increasingly automated world.`,
    keyQuestion: "Should society prioritize the rapid development and deployment of artificial intelligence, or should it proceed more cautiously to address potential risks and ethical concerns?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from a technology CEO's keynote address",
        text: `"AI represents the greatest opportunity for human progress since the Industrial Revolution. Every major advance in human civilization has been driven by tools that amplify human capability, and AI is the most powerful such tool ever created. Yes, there will be disruptions—there always are when transformative technologies emerge. But the solution is not to slow down innovation; it is to accelerate it while investing in education and retraining programs that help people adapt. The countries and companies that lead in AI development will shape the future of the global economy. Excessive caution risks ceding that leadership to competitors who may not share our values around safety and ethics."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from an AI ethics researcher's paper",
        text: `"The 'move fast and break things' mentality that has dominated the technology industry is fundamentally inappropriate when applied to AI systems that affect millions of lives. We have already seen the consequences of deploying AI without adequate safeguards: facial recognition systems that misidentify people of color at alarming rates, hiring algorithms that perpetuate gender discrimination, and social media recommendation engines that amplify misinformation and extremism. These are not minor bugs to be fixed in the next update—they are systematic failures that cause real harm to real people. Before we can responsibly expand AI's role in society, we need robust frameworks for testing, accountability, and oversight that match the scale and impact of these technologies."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from a labor union publication",
        text: `"The conversation about AI too often focuses on abstract questions of ethics and governance while ignoring the immediate, concrete impact on working people. Automation has already eliminated millions of jobs, and AI threatens to accelerate this trend dramatically. The promise that new technologies will create more jobs than they destroy has historically been true over long time horizons, but it offers little comfort to the workers and communities devastated in the interim. What we need is not just retraining programs—which often fail to deliver on their promises—but a fundamental rethinking of how the economic gains from AI are distributed. If AI makes it possible to produce more with less human labor, the benefits of that increased productivity should be shared broadly, not captured exclusively by technology companies and their shareholders."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Climate Change Policy",
    topic: `Climate change is widely recognized as one of the most pressing challenges facing humanity. Scientific consensus holds that human activities, particularly the burning of fossil fuels, are driving global warming at an unprecedented rate. Governments, corporations, and individuals all face difficult choices about how to respond. Some advocate for aggressive regulatory action, including carbon taxes and mandatory emissions reductions, while others argue that market-based solutions and technological innovation will prove more effective. Meanwhile, developing nations contend that wealthy countries, which are historically responsible for the majority of emissions, should bear a greater share of the costs of transition. The debate over climate policy ultimately involves fundamental questions about economic growth, intergenerational responsibility, and global equity.`,
    keyQuestion: "What is the most effective approach to addressing climate change: government regulation, market-based innovation, or individual behavioral change?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from an environmental policy journal",
        text: `"The scale and urgency of the climate crisis demand government intervention. Market forces alone have had decades to address carbon emissions and have failed to do so at the necessary pace. Only governments have the authority to set binding emissions targets, impose carbon pricing, and redirect subsidies away from fossil fuels toward renewable energy. The argument that regulation stifles innovation ignores the overwhelming evidence that well-designed environmental regulations have historically spurred technological advancement, not hindered it. The Clean Air Act, for example, drove the development of catalytic converters and scrubber technologies that created entire new industries. We need the same kind of bold regulatory action now, before the window for meaningful climate action closes permanently."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a business magazine",
        text: `"The most powerful force for addressing climate change is not government regulation but market innovation. When clean energy becomes cheaper than fossil fuels—and in many places it already has—the transition will happen naturally, driven by economic self-interest rather than government mandates. Heavy-handed regulation risks creating economic disruption, particularly in communities dependent on fossil fuel industries, and often produces unintended consequences that undermine their stated goals. What governments should do is invest in basic research, remove barriers to clean energy deployment, and let entrepreneurs and market competition drive the solutions. The smartphone revolution wasn't mandated by government—it was driven by innovation and consumer demand. The clean energy revolution can follow the same path."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from a developing nations' policy forum",
        text: `"The climate debate in wealthy nations often proceeds as if the entire world shares the same starting point and the same set of options. It does not. Developing countries, which have contributed the least to historical emissions, are often the most vulnerable to climate impacts and the least equipped to adapt. Asking these nations to forgo the fossil-fuel-driven development that made wealthy countries rich is not just impractical—it is unjust. Any effective climate policy must include substantial financial and technological transfers from wealthy to developing nations, recognition of differentiated responsibilities, and pathways that allow developing countries to grow their economies while transitioning to cleaner energy. Climate justice and climate action are not separate goals—they are inseparable."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Free Speech on Campus",
    topic: `Universities have long been considered bastions of free inquiry and open debate. In recent years, however, controversies over invited speakers, campus protests, and institutional speech policies have raised difficult questions about the limits of free expression in academic settings. Some argue that universities must protect even offensive or unpopular speech to fulfill their educational mission, while others contend that certain forms of speech cause real harm to vulnerable communities and that institutions have a responsibility to create inclusive environments. The tension between free expression and inclusivity has become one of the most contentious issues in higher education, with implications that extend far beyond campus boundaries.`,
    keyQuestion: "How should universities balance the commitment to free expression with the responsibility to create inclusive and supportive learning environments?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from a free speech advocacy organization",
        text: `"The purpose of a university is to pursue truth through open inquiry, and this requires the freedom to express and debate ideas—including ideas that some find offensive or uncomfortable. History shows that the suppression of speech, however well-intentioned, inevitably targets the most vulnerable and marginalized voices. The civil rights movement, the women's suffrage movement, and the LGBTQ rights movement all depended on the ability to express ideas that the mainstream found deeply objectionable. When universities restrict speech based on its content, they undermine the very process of intellectual growth that education is supposed to foster. The answer to speech you disagree with is more speech, not less."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a student advocacy group's statement",
        text: `"The abstract principle of free speech means little to students who are targeted by hate speech, harassment, or the deliberate promotion of ideologies that deny their humanity. When a university invites a speaker who argues that certain racial groups are intellectually inferior, or that transgender people don't exist, it is not engaging in neutral intellectual inquiry—it is lending institutional legitimacy to views that cause measurable psychological harm to members of the campus community. Universities have a duty of care to all their students, and this duty sometimes requires setting boundaries on the kinds of expression that are given institutional platforms. This is not censorship; it is responsible stewardship of an educational community."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from a higher education research paper",
        text: `"The free speech debate on campus is often framed as a binary choice between unrestricted expression and protective censorship, but this framing misses the more fundamental issue: the quality of discourse itself. The goal should not be simply to allow all speech or to restrict harmful speech, but to cultivate the conditions for productive intellectual engagement. This means teaching students how to engage critically with ideas they find challenging, creating structured forums for difficult conversations, and distinguishing between genuine intellectual inquiry and deliberate provocation. A university that simply hosts controversial speakers without providing context or facilitating meaningful dialogue is not fulfilling its educational mission any more than one that bans controversial ideas altogether."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Healthcare as a Right",
    topic: `Access to healthcare varies dramatically across and within nations. In some countries, universal healthcare systems provide coverage to all citizens regardless of ability to pay, while in others, healthcare is primarily delivered through private markets with varying degrees of government involvement. Proponents of universal healthcare argue that access to medical care is a fundamental human right that should not depend on one's wealth or employment status. Critics contend that government-run healthcare systems are inefficient, limit patient choice, and stifle medical innovation. As healthcare costs continue to rise and populations age, the debate over how to organize and finance healthcare has become increasingly urgent.`,
    keyQuestion: "Should access to healthcare be treated as a fundamental right guaranteed by the government, or is it better provided through private markets?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from a public health journal",
        text: `"Healthcare is not a commodity like any other—it is a fundamental prerequisite for human dignity and equal opportunity. A society that allows its members to suffer or die from treatable conditions because they cannot afford care has failed in its most basic obligation. Universal healthcare systems, despite their imperfections, consistently deliver better population health outcomes at lower per-capita costs than market-based systems. The United States, which relies most heavily on private healthcare, spends nearly twice as much per person as other wealthy nations while achieving worse outcomes on key measures like life expectancy and infant mortality. The evidence is clear: healthcare is too important and too complex to be left entirely to market forces."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from an economics think tank report",
        text: `"Government-run healthcare systems may provide universal coverage, but they do so at the cost of innovation, efficiency, and patient choice. The United States leads the world in medical research, pharmaceutical development, and the adoption of cutting-edge treatments precisely because its market-based system rewards innovation. Countries with universal healthcare often face long wait times, rationing of care, and limited access to the latest treatments. Rather than replacing the market with government control, we should focus on reforms that harness market competition to drive down costs while expanding access through targeted subsidies and safety nets for those who truly cannot afford care."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from a medical ethics textbook",
        text: `"The debate between public and private healthcare often obscures a more fundamental question: what kind of healthcare system best serves the goal of human flourishing? Neither pure market systems nor fully government-controlled systems adequately address the complex, deeply personal nature of healthcare. What we need is a hybrid approach that guarantees universal access to essential care while preserving space for private innovation and individual choice. Such a system would establish a robust public baseline—covering preventive care, emergency services, and treatment for serious conditions—while allowing private options for those who want additional services. This approach recognizes healthcare as both a right and a complex service that benefits from diverse delivery models."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Urban Development and Housing",
    topic: `Cities around the world are grappling with housing crises characterized by rising costs, inadequate supply, and growing inequality. In many major metropolitan areas, housing costs have far outpaced wage growth, pushing lower- and middle-income residents to the periphery or into homelessness. Various solutions have been proposed, from relaxing zoning regulations to allow denser development, to expanding public housing programs, to implementing rent control policies. Each approach has vocal supporters and critics, and the stakes are high: where and how people live shapes their access to employment, education, healthcare, and social networks. The housing crisis is ultimately a question about what kind of cities and communities we want to build.`,
    keyQuestion: "What is the most effective approach to addressing urban housing affordability: market deregulation, government intervention, or community-based solutions?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from an urban economics journal",
        text: `"The housing affordability crisis is fundamentally a supply problem, and the solution is straightforward: build more housing. Restrictive zoning laws, lengthy permitting processes, and neighborhood opposition to new development have artificially constrained housing supply in the cities where demand is greatest. When supply cannot keep pace with demand, prices rise—this is basic economics. Cities that have reformed their zoning codes to allow denser development, like Tokyo, have maintained relatively affordable housing even as their populations have grown. The most impactful thing governments can do is get out of the way and let the market build the housing that people need."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a housing advocacy organization's report",
        text: `"The market alone will never solve the housing crisis because the market has no incentive to build housing for people who cannot afford market-rate prices. For decades, we have relied on the private sector to meet housing needs, and the result has been a system that produces luxury condominiums while millions of families struggle to keep a roof over their heads. What we need is a massive expansion of public and social housing—permanently affordable housing that is owned and managed by public entities or nonprofit organizations. Countries like Austria and Singapore have demonstrated that large-scale public housing programs can provide high-quality, affordable homes while stabilizing housing markets for everyone."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from a community development journal",
        text: `"Both market-based and government-led approaches to housing tend to treat residents as passive consumers rather than active participants in shaping their communities. Community land trusts, cooperative housing, and participatory planning processes offer an alternative model in which residents have genuine ownership and control over their housing and neighborhoods. These approaches not only provide affordable housing but also build social cohesion, prevent displacement, and ensure that the benefits of community investment are shared by long-term residents rather than captured by developers and speculators. The housing crisis is not just about units and prices—it is about power, and the solution must involve redistributing that power to the communities most affected."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Social Media and Democracy",
    topic: `Social media platforms have fundamentally altered the landscape of public discourse and political engagement. On one hand, these platforms have democratized access to information, enabled grassroots organizing, and given voice to communities that were previously marginalized in traditional media. On the other hand, they have been implicated in the spread of misinformation, the polarization of political discourse, and the manipulation of elections through targeted advertising and foreign interference. As governments around the world consider how to regulate these powerful platforms, they face a fundamental tension between preserving the open exchange of ideas and protecting the integrity of democratic processes.`,
    keyQuestion: "Should governments regulate social media platforms to protect democratic processes, or would such regulation pose an unacceptable threat to free expression?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from a digital rights organization",
        text: `"Government regulation of social media is a cure worse than the disease. History demonstrates that when governments gain the power to regulate speech—even with the best of intentions—that power is inevitably used to silence dissent and protect those in power. The problems attributed to social media—misinformation, polarization, manipulation—are not new; they existed long before the internet. What social media has done is make these problems more visible, not more prevalent. The solution lies not in government censorship but in digital literacy education, platform transparency requirements, and empowering users with better tools to evaluate the information they encounter."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a political science journal",
        text: `"The scale and speed at which misinformation spreads on social media platforms represent a genuinely new threat to democratic governance. Traditional media, whatever its flaws, operated within a framework of editorial standards, legal accountability, and professional norms that provided some check on the spread of false information. Social media platforms have no such constraints, and their algorithmic amplification of engaging content systematically favors sensational and divisive material over accurate and nuanced reporting. Reasonable regulation—requiring transparency in political advertising, mandating algorithmic audits, and holding platforms accountable for the amplification of demonstrably false content—is not censorship. It is the kind of basic consumer protection that we expect in every other industry."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from a technology policy think tank",
        text: `"The debate over social media regulation often focuses on content moderation—what should and shouldn't be allowed on these platforms. But this focus on content misses the more fundamental problem: the business model itself. Social media platforms are designed to maximize engagement, and the most engaging content is often the most emotionally provocative, divisive, or misleading. No amount of content moderation can fix a system whose core incentive structure rewards the worst impulses of human nature. What we need is structural reform: breaking up monopolistic platforms, requiring interoperability so users can switch between services, and exploring alternative business models that don't depend on surveillance advertising. Fix the incentives, and the content problems will largely resolve themselves."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Immigration Policy",
    topic: `Immigration has become one of the most contentious political issues in many countries. Supporters of more open immigration policies point to the economic benefits of immigration, the moral imperative to provide refuge to those fleeing persecution, and the cultural enrichment that diverse populations bring. Critics argue that high levels of immigration strain public services, depress wages for native workers, and threaten social cohesion. Between these poles lie a range of positions about how to balance economic needs, humanitarian obligations, national security concerns, and cultural considerations. As global migration continues to increase due to conflict, economic inequality, and climate change, the need for thoughtful immigration policy has never been greater.`,
    keyQuestion: "How should nations balance economic interests, humanitarian obligations, and cultural considerations in shaping their immigration policies?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from an economics research institute",
        text: `"The economic case for immigration is overwhelming. Immigrants start businesses at higher rates than native-born citizens, fill critical labor shortages in sectors from agriculture to technology, and contribute more in taxes over their lifetimes than they receive in public benefits. Countries with aging populations and declining birth rates—which includes most of the developed world—face a simple demographic reality: without immigration, their workforces will shrink, their social safety nets will become unsustainable, and their economies will stagnate. The question is not whether we need immigration, but how to design immigration systems that efficiently match immigrant skills with economic needs while providing clear pathways to integration and citizenship."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a national security policy paper",
        text: `"A nation's first obligation is to its own citizens, and immigration policy must be evaluated primarily through the lens of national interest. This means maintaining secure borders, carefully vetting those who seek entry, and ensuring that immigration levels are sustainable given available resources for housing, healthcare, education, and social services. Uncontrolled immigration, however well-intentioned, can overwhelm communities, strain public infrastructure, and erode public trust in government institutions. A responsible immigration policy is not anti-immigrant—it is pro-community, ensuring that both newcomers and existing residents have the resources and support they need to thrive."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from a human rights organization's report",
        text: `"Immigration policy cannot be reduced to economic calculations or security assessments. At its core, immigration involves human beings—many of whom are fleeing war, persecution, extreme poverty, or environmental catastrophe. International law recognizes the right to seek asylum, and this right must be honored regardless of whether it is economically convenient. Moreover, the factors driving migration—global inequality, conflict, and climate change—are often the direct or indirect result of policies pursued by the very nations that now seek to restrict immigration. A just immigration policy must acknowledge these historical responsibilities and prioritize the protection of the most vulnerable, even when doing so requires sacrifice and political courage."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Education and Economic Inequality",
    topic: `Education has long been viewed as the great equalizer—the mechanism through which individuals from disadvantaged backgrounds can achieve upward mobility. However, growing evidence suggests that educational systems in many countries actually reinforce rather than reduce economic inequality. Wealthy families can afford private tutoring, test preparation, extracurricular activities, and tuition at elite institutions, while students from lower-income backgrounds often attend underfunded schools with fewer resources and less experienced teachers. As the economic returns to education continue to grow, the question of how to make educational opportunity more equitable has become central to debates about social justice and economic policy.`,
    keyQuestion: "Can education effectively reduce economic inequality, or does it primarily serve to reproduce existing social hierarchies?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from an education reform organization",
        text: `"Education remains the most powerful tool for economic mobility, but only if we are willing to invest in making it truly equitable. The problem is not with education itself but with the vast disparities in educational quality and access that exist along lines of race and class. Universal pre-kindergarten, equitable school funding formulas, free college tuition, and robust support services for first-generation students are not radical ideas—they are practical investments that would dramatically expand opportunity. Every dollar spent on quality education for disadvantaged students returns multiples in higher earnings, lower incarceration rates, and stronger communities. The question is not whether education can reduce inequality, but whether we have the political will to fund it properly."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a sociology journal",
        text: `"The belief that education alone can solve economic inequality is a comforting myth that allows us to avoid confronting the structural causes of poverty and inequality. Educational attainment has increased dramatically over the past century, yet economic inequality has grown, not shrunk. This is because the economic value of education is relative, not absolute: when everyone has a college degree, the degree becomes a baseline requirement rather than a path to advancement. Meanwhile, the factors that most powerfully determine economic outcomes—family wealth, social networks, neighborhood, and access to capital—operate largely outside the educational system. Education reform is important, but without addressing the broader structures of economic inequality, it will continue to function primarily as a sorting mechanism rather than an equalizer."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from an education philosophy book",
        text: `"The debate about education and inequality is hampered by a narrow, instrumental view of education's purpose. When we evaluate education primarily in terms of its economic returns, we reduce it to a tool for workforce preparation and social sorting. But education at its best serves a much broader purpose: it cultivates critical thinking, civic engagement, creative expression, and the capacity for meaningful relationships. A truly equitable education system would not simply help disadvantaged students compete more effectively in an unequal economy—it would equip all students with the knowledge and skills to critically examine and transform the social structures that produce inequality in the first place. The goal should not be equal access to an unequal system, but education that empowers people to create a more just society."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Genetic Engineering Ethics",
    topic: `Advances in genetic engineering, particularly the development of CRISPR gene-editing technology, have opened unprecedented possibilities for modifying the genetic code of living organisms, including humans. These technologies hold enormous promise for treating genetic diseases, improving crop yields, and advancing scientific understanding. However, they also raise profound ethical questions about the limits of human intervention in nature, the potential for exacerbating social inequalities, and the risks of unintended consequences. As the technology becomes more accessible and powerful, societies must grapple with fundamental questions about what it means to be human and how far we should go in reshaping the biological world.`,
    keyQuestion: "Should society embrace genetic engineering technologies, or should strict limits be placed on their development and use?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from a biomedical research journal",
        text: `"Genetic engineering represents one of the most significant advances in the history of medicine. For the first time, we have the ability to correct the genetic mutations that cause devastating diseases like sickle cell anemia, cystic fibrosis, and Huntington's disease. To restrict this technology out of vague fears about 'playing God' would be to condemn millions of people to unnecessary suffering. Every medical advance in history—from vaccines to organ transplants—has faced similar ethical objections, and in every case, the benefits have far outweighed the risks. We should proceed with appropriate safeguards and oversight, but we should proceed."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a bioethics commission report",
        text: `"The distinction between therapeutic and enhancement applications of genetic engineering is crucial and must be maintained. Using gene editing to cure disease is fundamentally different from using it to enhance traits like intelligence, athletic ability, or physical appearance. Enhancement applications risk creating a genetic underclass—those whose parents could not afford genetic optimization—and would fundamentally alter the meaning of human achievement and identity. Moreover, our understanding of genetics is far less complete than popular narratives suggest; genes interact in complex ways, and editing one gene can have unpredictable effects on others. The precautionary principle demands that we proceed with extreme caution, particularly when it comes to heritable modifications that would affect future generations who cannot consent."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from an environmental science publication",
        text: `"The debate about genetic engineering tends to focus on human applications, but the environmental implications are equally significant and perhaps more urgent. Genetically modified organisms released into ecosystems can have cascading effects that are difficult to predict and impossible to reverse. Gene drives—technologies that can spread genetic modifications through wild populations—could potentially eliminate disease-carrying mosquitoes, but they could also disrupt food webs and ecosystems in ways we cannot foresee. The history of human intervention in natural systems is largely a history of unintended consequences. Before we deploy these powerful technologies at scale, we need much better tools for predicting and monitoring their ecological impacts."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "The Future of Work",
    topic: `The nature of work is undergoing a fundamental transformation. Automation, artificial intelligence, the gig economy, and remote work are reshaping how, where, and for whom people work. Some see these changes as liberating—offering greater flexibility, autonomy, and freedom from the constraints of traditional employment. Others view them with alarm, pointing to the erosion of job security, benefits, and the social connections that workplaces provide. The COVID-19 pandemic accelerated many of these trends, forcing a global experiment in remote work and prompting widespread reflection on the role of work in human life. As these changes continue to unfold, fundamental questions about the social contract between employers and workers, the meaning of a career, and the distribution of economic opportunity demand urgent attention.`,
    keyQuestion: "Are the changes transforming the modern workplace primarily beneficial or harmful to workers and society?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from a management consulting report",
        text: `"The future of work is bright for those who embrace it. The shift toward flexible, project-based work liberates talented individuals from the constraints of rigid corporate hierarchies and geographic limitations. Remote work has opened opportunities for people in rural areas and developing countries to access jobs that were previously available only to those living in expensive urban centers. The gig economy, despite its critics, provides a safety valve for people who need income flexibility—students, caregivers, and those between traditional jobs. The key is to update our social safety nets and labor laws to reflect these new realities, rather than trying to preserve an industrial-era model of employment that no longer serves most workers' needs."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a labor economics journal",
        text: `"The celebration of workplace 'flexibility' often masks a transfer of risk from employers to workers. When companies classify workers as independent contractors rather than employees, they avoid providing health insurance, retirement benefits, paid leave, and unemployment insurance. When work becomes 'remote,' the costs of office space, equipment, and utilities shift to the worker. When schedules become 'flexible,' workers often find themselves working longer hours with less predictability. The fundamental power imbalance between employers and individual workers has not changed—if anything, the fragmentation of the workforce has made it harder for workers to organize and advocate for their interests. Without strong labor protections and collective bargaining rights, the 'future of work' will be a future of increased precarity for most workers."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from a philosophy of work book",
        text: `"The transformation of work presents an opportunity to ask a question that our productivity-obsessed culture has long avoided: what is work actually for? For most of human history, work was simply what people did to survive. The idea that work should be a source of meaning, identity, and fulfillment is relatively recent and culturally specific. As automation eliminates the need for much human labor, we have the opportunity to decouple survival from employment and reimagine how people spend their time. Universal basic income, shorter work weeks, and investment in care work, creative pursuits, and community engagement could create a society in which people work because they want to, not because they have to. The question is whether we have the imagination and courage to build such a society."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Media Literacy and Misinformation",
    topic: `The proliferation of online information sources has made it both easier and harder for citizens to stay informed about important issues. While the internet provides access to an unprecedented breadth of information, it has also enabled the rapid spread of misinformation, conspiracy theories, and propaganda. Traditional gatekeepers of information—journalists, editors, and fact-checkers—have seen their influence diminish as social media algorithms and partisan outlets compete for attention. Some argue that the solution lies in better education and media literacy, while others call for platform regulation or technological solutions. The challenge of navigating an information environment saturated with both valuable knowledge and deliberate falsehood has become a defining feature of contemporary civic life.`,
    keyQuestion: "What is the most effective way to combat the spread of misinformation in the digital age?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from a journalism education journal",
        text: `"The most sustainable solution to misinformation is education. Media literacy—the ability to critically evaluate sources, identify bias, distinguish fact from opinion, and understand how information is produced and distributed—should be a core component of education at every level. Countries like Finland, which have integrated media literacy into their national curriculum, consistently rank among the most resistant to misinformation. This approach respects individual autonomy by empowering people to make informed judgments rather than relying on external authorities to decide what is true. It also addresses the root cause of the problem: not the existence of false information, which has always been with us, but the lack of skills needed to navigate it."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a cognitive science research paper",
        text: `"Media literacy education, while valuable, is insufficient to address the misinformation crisis. Research in cognitive science consistently shows that humans are not rational information processors—we are subject to confirmation bias, motivated reasoning, and emotional manipulation regardless of our education level. Highly educated people are often MORE susceptible to certain forms of misinformation because they are better at constructing rationalizations for beliefs they want to hold. Effective solutions must account for these cognitive limitations by designing information environments that make it harder for misinformation to spread in the first place. This means reforming the algorithmic systems that amplify sensational content, requiring clear labeling of AI-generated content, and investing in professional fact-checking infrastructure."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from a political communication textbook",
        text: `"The focus on 'misinformation' as a technical problem to be solved through education or technology obscures the fundamentally political nature of the crisis. Misinformation thrives not because people lack media literacy skills, but because trust in institutions—government, media, science, and expertise itself—has eroded. This erosion of trust has real causes: decades of institutional failures, broken promises, and the perception that elites serve their own interests rather than the public good. Addressing misinformation requires rebuilding institutional trustworthiness, not just teaching people to be better consumers of information. This means greater transparency, accountability, and responsiveness from the institutions that produce and disseminate knowledge."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Animal Rights and Food Systems",
    topic: `The treatment of animals in modern food production systems has become an increasingly prominent ethical and environmental concern. Industrial animal agriculture, which produces the vast majority of meat, dairy, and eggs consumed worldwide, has been criticized for causing animal suffering, contributing to climate change, polluting waterways, and creating conditions that facilitate the emergence of antibiotic-resistant bacteria and zoonotic diseases. Advocates for change range from those who call for modest welfare reforms to those who argue for the complete abolition of animal agriculture. Meanwhile, the development of plant-based alternatives and lab-grown meat offers the possibility of satisfying demand for animal products without the associated harms. The debate touches on fundamental questions about human relationships with other species, the ethics of food production, and the sustainability of current consumption patterns.`,
    keyQuestion: "To what extent do humans have an ethical obligation to change their relationship with animals in food production?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from an animal welfare organization's publication",
        text: `"The scale of suffering in industrial animal agriculture is staggering and morally indefensible. Billions of sentient beings spend their entire lives in conditions of extreme confinement, unable to express their most basic natural behaviors. The scientific evidence that animals experience pain, fear, and distress is overwhelming and no longer seriously disputed. While cultural traditions and economic interests have long been used to justify the exploitation of animals, these justifications are no different in kind from those historically used to justify other forms of oppression. At minimum, we must demand meaningful welfare reforms that address the worst abuses. Ultimately, however, a just society must move toward food systems that do not depend on the systematic suffering of other sentient beings."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from an agricultural economics report",
        text: `"Animal agriculture is a critical component of global food security and rural economies. Livestock provide essential nutrition—particularly protein and micronutrients—to billions of people, many of whom have limited access to alternatives. In developing countries, livestock are often the primary source of income, savings, and social status for smallholder farmers. Proposals to dramatically reduce or eliminate animal agriculture fail to account for these realities and risk imposing the dietary preferences of wealthy, urban populations on communities for whom animal products are not a luxury but a necessity. The focus should be on improving efficiency and welfare standards within animal agriculture, not on eliminating an industry that feeds the world."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from an environmental science journal",
        text: `"The environmental case against industrial animal agriculture is compelling regardless of one's position on animal ethics. Livestock production accounts for approximately 14.5% of global greenhouse gas emissions, uses roughly 70% of agricultural land, and is a leading driver of deforestation, biodiversity loss, and water pollution. These environmental costs are largely externalized—not reflected in the price consumers pay for animal products. A transition toward more plant-based diets, supported by investment in alternative proteins and the reform of agricultural subsidies, would yield enormous environmental benefits while also reducing the risk of future pandemics. This is not about moral purity; it is about the pragmatic recognition that our current food system is environmentally unsustainable."`,
      },
    ],
    source: "practice_prompt",
  },
  {
    title: "Space Exploration Priorities",
    topic: `As space technology advances and private companies join government agencies in pursuing ambitious space programs, debate has intensified over the purpose and priorities of space exploration. Some advocate for a return to the Moon and eventual human settlement of Mars, arguing that becoming a multi-planetary species is essential for humanity's long-term survival. Others contend that the enormous resources devoted to space exploration would be better spent addressing urgent problems on Earth, from poverty and disease to climate change. Still others see space primarily as a domain for scientific research, satellite technology, and commercial development. The question of what humanity should do in space is ultimately a question about values, priorities, and the kind of future we want to build.`,
    keyQuestion: "Should humanity prioritize space exploration and colonization, or should those resources be directed toward solving problems on Earth?",
    perspectives: [
      {
        label: "Perspective 1",
        source: "an excerpt from a space advocacy organization",
        text: `"Space exploration is not a luxury—it is an investment in humanity's future. Every major civilization that has stopped exploring has eventually declined. The technologies developed for space programs have yielded countless benefits on Earth, from GPS and weather satellites to medical imaging and water purification systems. More fundamentally, establishing a human presence beyond Earth is the ultimate insurance policy against existential risks—asteroid impacts, supervolcanic eruptions, or self-inflicted catastrophes. The argument that we should solve all problems on Earth before venturing into space is a false choice; we are capable of doing both, and the inspiration and innovation generated by space exploration actually helps us address earthly challenges."`,
      },
      {
        label: "Perspective 2",
        source: "an excerpt from a global development policy paper",
        text: `"While space exploration captures the imagination, the allocation of tens of billions of dollars to send humans to Mars while billions of people on Earth lack access to clean water, basic healthcare, and adequate nutrition represents a profound misalignment of priorities. The technological spinoffs from space programs, while real, could be achieved more efficiently through direct investment in the relevant technologies. The romantic vision of colonizing other planets also obscures the harsh reality that Mars is a dead, irradiated desert where human survival would require enormous ongoing investment and would offer a quality of life far inferior to what we could create on Earth with the same resources. Our planet is not beyond saving, and the resources devoted to escaping it would be better spent preserving it."`,
      },
      {
        label: "Perspective 3",
        source: "an excerpt from a science and technology studies journal",
        text: `"The space exploration debate often proceeds as if the choice is between grand human missions and nothing at all. In reality, the most valuable space activities—Earth observation satellites, telecommunications infrastructure, and robotic scientific missions—require a fraction of the cost of human spaceflight and deliver far greater practical and scientific returns. The push for human Mars missions is driven more by national prestige and billionaire vanity projects than by sound scientific or strategic reasoning. A more rational space policy would prioritize the activities that provide the greatest benefit to the greatest number of people, while continuing robotic exploration of the solar system and investing in the fundamental science that might one day make human deep-space travel practical and worthwhile."`,
      },
    ],
    source: "practice_prompt",
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("LSAT Writing Prompts Seeder");
  console.log("=".repeat(50));

  console.log("Clearing existing writing prompts...");
  await db.delete(writingPrompts);

  console.log(`Inserting ${PROMPTS.length} writing prompts...`);

  for (const prompt of PROMPTS) {
    await db.insert(writingPrompts).values({
      title: prompt.title,
      topic: prompt.topic,
      keyQuestion: prompt.keyQuestion,
      perspectives: prompt.perspectives,
      prewritingQuestions: STANDARD_PREWRITING,
      directions: DIRECTIONS,
      source: prompt.source,
    });
    console.log(`  -> ${prompt.title}`);
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Done! Inserted ${PROMPTS.length} writing prompts.`);
  console.log("  1 official LSAC sample + practice prompts covering diverse topics");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
